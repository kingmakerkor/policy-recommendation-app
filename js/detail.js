import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase 설정 (클라이언트 측)
const supabaseUrl = 'https://asjovomafktjahqovode.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzam92b21hZmt0amFocW92b2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUxNDAsImV4cCI6MjA2OTI3MTE0MH0.H9loaabUuVjpbDpaEfsWK9YnSuxjYY3fXUyebHOavDo';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const policyId = urlParams.get('id');

    console.log('Detail Page: policyId from URL ->', policyId); // Debugging

    if (!policyId) {
        document.getElementById('detail-name').textContent = '정책 ID가 없습니다.';
        document.getElementById('detail-description').textContent = '올바른 경로로 접근해주세요.';
        return;
    }

    try {
        const { data: policy, error } = await supabase
            .from('policies')
            .select('*')
            .eq('id', policyId)
            .single();

        console.log('Detail Page: Supabase query result -> data:', policy, 'error:', error); // Debugging

        if (error && error.code !== 'PGRST116') { // PGRST116은 데이터 없음 오류
            console.error('Error fetching policy from Supabase:', error);
            document.getElementById('detail-name').textContent = '오류 발생';
            document.getElementById('detail-description').textContent = '정책 정보를 불러오는 중 오류가 발생했습니다.';
            return;
        }

        if (policy) {
            console.log('Detail Page: Policy data loaded ->', policy); // Debugging
            document.getElementById('detail-name').textContent = policy.name;
            document.getElementById('detail-description').textContent = policy.description;

            // 동적으로 메타 태그 업데이트
            document.title = `${policy.name} - 정책 상세 정보`;
            document.querySelector('meta[name="description"]').setAttribute('content', policy.description);
            document.querySelector('meta[property="og:title"]').setAttribute('content', policy.name);
            document.querySelector('meta[property="og:description"]').setAttribute('content', policy.description);
            document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);

            document.getElementById('detail-age-condition').textContent = 
                `나이 조건: 만 ${policy.min_age || '-'}세 ~ ${policy.max_age || '-'}세`;
            
            let incomeConditionText = '소득 조건: -';
            if (policy.min_income !== undefined || policy.max_income !== undefined) {
                incomeConditionText = `소득 조건: `;
                if (policy.min_income !== undefined) {
                    incomeConditionText += `월 ${policy.min_income}만원 이상 `;
                }
                if (policy.max_income !== undefined) {
                    incomeConditionText += `월 ${policy.max_income}만원 이하`;
                }
            }
            document.getElementById('detail-income-condition').textContent = incomeConditionText;

            let regionConditionText = '지역: -';
            if (policy.region && policy.region.length > 0) {
                regionConditionText = `지역: ${policy.region.join(', ')}`;
            }
            document.getElementById('detail-region-condition').textContent = regionConditionText;

            // 새로 추가된 상세 정보 필드 채우기
            document.getElementById('detail-jur-mnof-nm').textContent = policy.jur_mnof_nm || '-';
            document.getElementById('detail-jur-org-nm').textContent = policy.jur_org_nm || '-';
            document.getElementById('detail-life-array').textContent = policy.life_array || '-';
            document.getElementById('detail-onap-psblt-yn').textContent = policy.onap_psblt_yn || '-';
            document.getElementById('detail-rprs-ctadr').textContent = policy.rprs_ctadr || '-';
            
            const servDtlLinkElement = document.getElementById('detail-serv-dtl-link');
            if (policy.serv_dtl_link) {
                servDtlLinkElement.href = policy.serv_dtl_link;
                servDtlLinkElement.textContent = policy.serv_dtl_link;
            } else {
                servDtlLinkElement.textContent = '-';
                servDtlLinkElement.removeAttribute('href');
            }

            document.getElementById('detail-sprt-cyc-nm').textContent = policy.sprt_cyc_nm || '-';
            document.getElementById('detail-srv-pvsn-nm').textContent = policy.srv_pvsn_nm || '-';
            document.getElementById('detail-svcfrst-reg-ts').textContent = policy.svcfrst_reg_ts || '-';
            document.getElementById('detail-trgter-indvdl-array').textContent = policy.trgter_indvdl_array || '-';
            document.getElementById('detail-inq-num').textContent = policy.inq_num || '-';
            document.getElementById('detail-intrs-thema-array').textContent = policy.intrs_thema_array || '-';

            // 새로 추가된 상세 내용 필드 채우기
            document.getElementById('detail-tgtr-dtl-cn').textContent = policy.tgtr_dtl_cn || '-';
            document.getElementById('detail-slct-crit-cn').textContent = policy.slct_crit_cn || '-';
            document.getElementById('detail-alw-serv-cn').textContent = policy.alw_serv_cn || '-';

        } else {
            document.getElementById('detail-name').textContent = '정책을 찾을 수 없습니다.';
            document.getElementById('detail-description').textContent = '해당 ID의 정책이 존재하지 않습니다.';
        }

    } catch (error) {
        console.error('Error fetching policy details:', error);
        document.getElementById('detail-name').textContent = '오류 발생';
        document.getElementById('detail-description').textContent = '정책 정보를 불러오는 중 오류가 발생했습니다.';
    }
});