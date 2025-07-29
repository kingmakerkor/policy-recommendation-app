document.addEventListener('DOMContentLoaded', () => {
    const policyForm = document.getElementById('policy-form');
    const policyList = document.getElementById('policy-list');
    const lifeArraySelect = document.getElementById('life-array'); // 생애주기 select
    const trgterIndvdlArraySelect = document.getElementById('trgter-indvdl-array'); // 가구유형 select
    const intrsThemaArraySelect = document.getElementById('intrs-thema-array'); // 관심주제 select
    const loadingSpinner = document.getElementById('loading-spinner');
    const resetFormBtn = document.getElementById('reset-form-btn');
    const sortBySelect = document.getElementById('sort-by');

    // 기존 나이/소득 피드백은 더 이상 사용하지 않으므로 제거
    // const ageFeedback = document.getElementById('age-feedback');
    // const incomeFeedback = document.getElementById('income-feedback');

    let currentPolicies = [];

    // 유효성 검사 피드백 초기화 함수 (이제 필요 없음)
    function resetValidationFeedback() {
        // ageInput.classList.remove('is-invalid');
        // ageFeedback.textContent = '';
        // incomeInput.classList.remove('is-invalid');
        // incomeFeedback.textContent = '';
    }

    function resetForm() {
        policyForm.reset();
        // resetValidationFeedback(); // 이제 필요 없음
        policyList.innerHTML = '';
        loadingSpinner.style.display = 'none';
        sortBySelect.value = 'default';
        currentPolicies = [];
    }

    resetFormBtn.addEventListener('click', resetForm);

    sortBySelect.addEventListener('change', () => {
        sortAndDisplayPolicies(currentPolicies, sortBySelect.value);
    });

    policyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // resetValidationFeedback(); // 이제 필요 없음

        const selectedLifeArray = lifeArraySelect.value; // 생애주기 값
        const selectedTrgterIndvdlArray = trgterIndvdlArraySelect.value; // 가구유형 값
        const selectedIntrsThemaArray = intrsThemaArraySelect.value; // 관심주제 값

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
                    // 정책의 life_array가 쉼표로 구분된 문자열이므로, 배열로 변환하여 포함 여부 확인
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

                // 모든 조건이 만족해야 함
                return lifeArrayMatch && trgterIndvdlArrayMatch && intrsThemaArrayMatch;
            });

            currentPolicies = filteredPolicies;
            sortAndDisplayPolicies(currentPolicies, sortBySelect.value);

        } catch (error) {
            console.error('Error:', error);
            policyList.innerHTML = '<div class="list-group-item">오류가 발생했습니다. 다시 시도해주세요.</div>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function sortAndDisplayPolicies(policies, sortBy) {
        let sortedPolicies = [...policies];

        switch (sortBy) {
            case 'name-asc':
                sortedPolicies.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                sortedPolicies.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'age-asc':
                sortedPolicies.sort((a, b) => (a.min_age || 0) - (b.min_age || 0));
                break;
            case 'age-desc':
                sortedPolicies.sort((a, b) => (b.min_age || 0) - (a.min_age || 0));
                break;
            case 'default':
            default:
                break;
        }
        displayResults(sortedPolicies);
    }

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

            // min_age, max_age, min_income, max_income, region은 이제 API에서 직접 제공되지 않으므로 표시하지 않음
            // 대신 life_array, trgter_indvdl_array, intrs_thema_array를 표시
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