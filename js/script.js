document.addEventListener('DOMContentLoaded', () => {
    const policyForm = document.getElementById('policy-form');
    const policyList = document.getElementById('policy-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resetFormBtn = document.getElementById('reset-form-btn');

    // 라디오 버튼 그룹 가져오기
    const lifeArrayRadios = document.querySelectorAll('input[name="lifeArray"]');
    const trgterIndvdlArrayRadios = document.querySelectorAll('input[name="trgterIndvdlArray"]');
    const intrsThemaArrayRadios = document.querySelectorAll('input[name="intrsThemaArray"]');

    // 생애주기 및 대상자 개인 코드 매핑 (script.js에도 필요)
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

    const intrsThemaArrayMap = {
        '001': '신체건강',
        '002': '정신건강',
        '003': '생활지원',
        '004': '주거',
        '005': '일자리',
        '006': '문화·여가',
        '007': '교육',
        '008': '안전·위기',
        '009': '보호·돌봄',
        '010': '법률',
        '011': '서민금융',
        '012': '보육',
        '013': '에너지'
    };

    let currentPolicies = [];

    function resetForm() {
        policyForm.reset();
        policyList.innerHTML = '';
        loadingSpinner.style.display = 'none';
        currentPolicies = [];
    }

    resetFormBtn.addEventListener('click', resetForm);

    policyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedLifeArray = document.querySelector('input[name="lifeArray"]:checked').value; 
        const selectedTrgterIndvdlArray = document.querySelector('input[name="trgterIndvdlArray"]:checked').value; 
        const selectedIntrsThemaArray = document.querySelector('input[name="intrsThemaArray"]:checked').value; 

        policyList.innerHTML = '';
        loadingSpinner.style.display = 'block';

        try {
            const response = await fetch('/api/policies');
            if (!response.ok) {
                throw new Error('정책 데이터를 불러오는 데 실패했습니다.');
            }
            const policies = await response.json();

            const filteredPolicies = policies.filter(policy => {
                let lifeArrayMatch = true;
                if (selectedLifeArray) {
                    const policyLifeArrays = policy.life_array ? policy.life_array.split(',').map(s => s.trim()) : [];
                    lifeArrayMatch = policyLifeArrays.includes(lifeArrayMap[selectedLifeArray]);
                }

                let trgterIndvdlArrayMatch = true;
                if (selectedTrgterIndvdlArray) {
                    const policyTrgterIndvdlArrays = policy.trgter_indvdl_array ? policy.trgter_indvdl_array.split(',').map(s => s.trim()) : [];
                    trgterIndvdlArrayMatch = policyTrgterIndvdlArrays.includes(trgterIndvdlArrayMap[selectedTrgterIndvdlArray]);
                }

                let intrsThemaArrayMatch = true;
                if (selectedIntrsThemaArray) {
                    const policyIntrsThemaArrays = policy.intrs_thema_array ? policy.intrs_thema_array.split(',').map(s => s.trim()) : [];
                    intrsThemaArrayMatch = policyIntrsThemaArrays.includes(intrsThemaArrayMap[selectedIntrsThemaArray]);
                }

                return lifeArrayMatch && trgterIndvdlArrayMatch && intrsThemaArrayMatch;
            });

            currentPolicies = filteredPolicies;
            displayResults(currentPolicies);

        } catch (error) {
            console.error('Error:', error);
            policyList.innerHTML = '<div class="list-group-item">오류가 발생했습니다. 다시 시도해주세요.</div>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function displayResults(policies) {
        policyList.innerHTML = '';

        if (policies.length === 0) {
            policyList.innerHTML = `
                <div class="list-group-item text-center py-4">
                    <p class="lead mb-3">아쉽지만, 현재 조건에 맞는 정책이 없습니다.</p>
                    <p>다른 생애주기, 가구유형, 관심주제로 다시 검색해보세요!</p>
                    <p>혹은 <a href="admin.html">관리자 페이지</a>에서 새로운 정책을 추가할 수 있습니다.</p>
                </div>
            `;
            return;
        }

        policies.forEach(policy => {
            const policyElement = document.createElement('a');
            policyElement.href = `detail.html?id=${policy.id}`;
            policyElement.className = 'list-group-item list-group-item-action';

            let lifeTrgterThemaInfo = '';
            if (policy.life_array || policy.trgter_indvdl_array || policy.intrs_thema_array) {
                lifeTrgterThemaInfo += `대상: ${policy.trgter_indvdl_array || '-'} | 생애주기: ${policy.life_array || '-'} | 관심주제: ${policy.intrs_thema_array || '-'}`;
            }

            policyElement.innerHTML = `
                <h5 class="mb-1">${policy.name}</h5>
                <p class="mb-1">${policy.description}</p>
                <small>${lifeTrgterThemaInfo}</small>
            `;
            policyList.appendChild(policyElement);
        });
    }
});