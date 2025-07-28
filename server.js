const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');
const cron = require('node-cron'); // node-cron 임포트
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

const supabaseUrl = 'https://asjovomafktjahqovode.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzam92b21hZmt0amFocW92b2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUxNDAsImV4cCI6MjA2OTI3MTE0MH0.H9loaabUuVjpbDpaEfsWK9YnSuxjYY3fXUyebHOavDo';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const readPolicies = async () => {
    const { data, error } = await supabase
        .from('policies')
        .select('*');
    if (error) {
        console.error('Error reading policies from Supabase:', error);
        return [];
    }
    return data;
};

const writePolicies = (policies) => {
    console.warn('writePolicies 함수는 더 이상 policies.json 파일에 직접 쓰지 않습니다. Supabase를 사용하세요.');
};

app.get('/api/policies', async (req, res) => {
    const policies = await readPolicies();
    res.json(policies);
});

app.post('/api/policies', async (req, res) => {
    const newPolicy = req.body;
    const { data, error } = await supabase
        .from('policies')
        .insert([newPolicy])
        .select();

    if (error) {
        console.error('Error adding policy to Supabase:', error);
        return res.status(500).json({ message: '정책 추가 중 오류가 발생했습니다.', error: error.message });
    }
    res.status(201).json(data[0]);
});

app.put('/api/policies/:id', async (req, res) => {
    const policyId = req.params.id;
    const updatedPolicy = req.body;

    const { data, error } = await supabase
        .from('policies')
        .update(updatedPolicy)
        .eq('id', policyId)
        .select();

    if (error) {
        console.error('Error updating policy in Supabase:', error);
        return res.status(500).json({ message: '정책 수정 중 오류가 발생했습니다.', error: error.message });
    }
    if (data.length === 0) {
        return res.status(404).send('Policy not found');
    }
    res.json(data[0]);
});

app.delete('/api/policies/:id', async (req, res) => {
    const policyId = req.params.id;

    const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', policyId);

    if (error) {
        console.error('Error deleting policy from Supabase:', error);
        return res.status(500).json({ message: '정책 삭제 중 오류가 발생했습니다.', error: error.message });
    }
    res.status(204).send();
});

// 생애주기 및 대상자 개인 코드 매핑
const lifeArrayMap = {
    '001': '영유아',
    '002': '아동',
    '003': '청소년',
    '004': '청년',
    '005': '중장년',
    '006': '노년',
    '007': '임신·출산'
};

const trgterIndvdlArrayMap = {
    '010': '다문화·탈북민',
    '020': '다자녀',
    '030': '보훈대상자',
    '040': '장애인',
    '050': '저소득',
    '060': '한부모·조손'
};

// API 업데이트 함수 (스케줄링을 위해 별도 함수로 분리)
const updatePoliciesFromApi = async () => {
    const serviceKey = process.env.WELFARE_API_KEY; 
    if (!serviceKey) {
        console.error('WELFARE_API_KEY 환경 변수가 설정되지 않았습니다. 정책 업데이트를 건너뜁니다.');
        return { message: 'WELFARE_API_KEY 환경 변수가 설정되지 않았습니다.' };
    }

    const apiUrl = `http://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001?serviceKey=${serviceKey}&callTp=L&pageNo=1&numOfRows=100&srchKeyCode=001`;

    try {
        const apiResponse = await axios.get(apiUrl);
        const xmlData = apiResponse.data;

        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        let newPoliciesFromApi = [];

        if (result && result.wantedList && result.wantedList.servList) {
            const items = Array.isArray(result.wantedList.servList) ? result.wantedList.servList : [result.wantedList.servList];
            
            newPoliciesFromApi = items.map(item => ({
                id: item.servId, 
                name: item.servNm, 
                description: item.servDgst || item.servNm, // servDgst만 사용
                min_age: 0, 
                max_age: 100, 
                min_income: 0, 
                max_income: 9999, 
                region: ['전국'],
                jur_mnof_nm: item.jurMnofNm || null,
                jur_org_nm: item.jurOrgNm || null,
                life_array: item.lifeArray ? item.lifeArray.split(',').map(code => lifeArrayMap[code.trim()] || code.trim()).join(',') : null,
                onap_psblt_yn: item.onapPsbltYn || null,
                rprs_ctadr: item.rprsCtadr || null,
                serv_dtl_link: item.servDtlLink || null,
                sprt_cyc_nm: item.sprtCycNm || null,
                srv_pvsn_nm: item.srvPvsnNm || null,
                svcfrst_reg_ts: item.svcfrstRegTs || null,
                trgter_indvdl_array: item.trgterIndvdlArray ? item.trgterIndvdlArray.split(',').map(code => trgterIndvdlArrayMap[code.trim()] || code.trim()).join(',') : null,
                inq_num: item.inqNum || null,
                intrs_thema_array: item.intrsThemaArray || null
            }));
        } else {
            console.warn('API 응답에서 정책 데이터를 찾을 수 없습니다:', result);
            return { message: 'API에서 가져올 정책 데이터가 없거나 응답 구조가 예상과 다릅니다.' };
        }

        let addedCount = 0;
        let updatedCount = 0;

        for (const apiPolicy of newPoliciesFromApi) {
            const { data: existingPolicy, error: selectError } = await supabase
                .from('policies')
                .select('id')
                .eq('id', apiPolicy.id)
                .single();

            if (selectError && selectError.code !== 'PGRST116') {
                console.error('Error checking existing policy in Supabase:', selectError);
                continue;
            }

            if (existingPolicy) {
                const { error: updateError } = await supabase
                    .from('policies')
                    .update(apiPolicy)
                    .eq('id', apiPolicy.id);
                if (updateError) {
                    console.error('Error updating policy in Supabase:', updateError);
                } else {
                    updatedCount++;
                }
            } else {
                const { error: insertError } = await supabase
                    .from('policies')
                    .insert([apiPolicy]);
                if (insertError) {
                    console.error('Error inserting policy into Supabase:', insertError);
                } else {
                    addedCount++;
                }
            }
        }
        
        console.log(`API 업데이트 완료: ${addedCount}개 정책 추가, ${updatedCount}개 정책 업데이트.`);
        return { 
            message: 'API 연동을 통한 정책 업데이트가 완료되었습니다.', 
            addedCount: addedCount, 
            updatedCount: updatedCount 
        };

    } catch (error) {
        console.error('Error during API update:', error);
        return { message: 'API 연동 중 오류가 발생했습니다.', error: error.message };
    }
};

// 자동 업데이트 트리거 엔드포인트
app.get('/api/trigger-update', async (req, res) => {
    const result = await updatePoliciesFromApi();
    res.json(result);
});

// 스케줄링: 매일 새벽 3시에 정책 업데이트 실행
cron.schedule('0 3 * * *', async () => {
    console.log('Scheduled policy update started...');
    await updatePoliciesFromApi();
    console.log('Scheduled policy update finished.');
}, {
    scheduled: true,
    timezone: "Asia/Seoul" // 한국 시간대 설정
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
