document.addEventListener('DOMContentLoaded', () => {
    const policyForm = document.getElementById('policy-form');
    const policyList = document.getElementById('policy-list');
    const ageInput = document.getElementById('age');
    const incomeInput = document.getElementById('income');
    const regionInput = document.getElementById('region');
    const keywordInput = document.getElementById('keyword');
    const loadingSpinner = document.getElementById('loading-spinner');

    const ageFeedback = document.getElementById('age-feedback');
    const incomeFeedback = document.getElementById('income-feedback');

    // 유효성 검사 피드백 초기화 함수
    function resetValidationFeedback() {
        ageInput.classList.remove('is-invalid');
        ageFeedback.textContent = '';
        incomeInput.classList.remove('is-invalid');
        incomeFeedback.textContent = '';
    }

    policyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        resetValidationFeedback(); // 새로운 제출 시 유효성 검사 피드백 초기화

        const age = parseInt(ageInput.value, 10);
        const income = parseInt(incomeInput.value, 10);
        const region = regionInput.value.trim();
        const keyword = keywordInput.value.trim().toLowerCase();

        let isValid = true;

        if (isNaN(age) || age < 0) {
            ageInput.classList.add('is-invalid');
            ageFeedback.textContent = '나이를 정확한 숫자로 입력해주세요. (0 이상)';
            isValid = false;
        }

        if (isNaN(income) || income < 0) {
            incomeInput.classList.add('is-invalid');
            incomeFeedback.textContent = '월 소득을 정확한 숫자로 입력해주세요. (0 이상)';
            isValid = false;
        }

        if (!isValid) {
            return; // 유효성 검사 실패 시 함수 종료
        }

        policyList.innerHTML = '';
        loadingSpinner.style.display = 'block';

        try {
            const response = await fetch('/api/policies');
            if (!response.ok) {
                throw new Error('정책 데이터를 불러오는 데 실패했습니다.');
            }
            const policies = await response.json();

            const filteredPolicies = policies.filter(policy => {
                const ageMatch = age >= policy.min_age && age <= policy.max_age;
                const incomeMatch = (policy.min_income === undefined || income >= policy.min_income) &&
                                    (policy.max_income === undefined || income <= policy.max_income);

                let regionMatch = true;
                if (policy.region && policy.region.length > 0) {
                    if (!policy.region.includes("전국")) {
                        if (region) {
                            regionMatch = policy.region.some(r => r.trim().toLowerCase() === region.toLowerCase());
                        } else {
                            regionMatch = false;
                        }
                    }
                }

                let keywordMatch = true;
                if (keyword) {
                    const policyName = policy.name ? policy.name.toLowerCase() : '';
                    const policyDescription = policy.description ? policy.description.toLowerCase() : '';
                    keywordMatch = policyName.includes(keyword) || policyDescription.includes(keyword);
                }

                return ageMatch && incomeMatch && regionMatch && keywordMatch;
            });

            displayResults(filteredPolicies);

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
                    <p>다른 나이, 소득, 지역 또는 키워드로 다시 검색해보세요!</p>
                    <p>혹은 <a href="admin.html">관리자 페이지</a>에서 새로운 정책을 추가할 수 있습니다.</p>
                </div>
            `;
            return;
        }

        policies.forEach(policy => {
            const policyElement = document.createElement('div');
            policyElement.className = 'list-group-item';

            let incomeCondition = '';
            if (policy.min_income !== undefined || policy.max_income !== undefined) {
                incomeCondition = ` | 소득 조건: `;
                if (policy.min_income !== undefined) {
                    incomeCondition += `월 ${policy.min_income}만원 이상 `;
                }
                if (policy.max_income !== undefined) {
                    incomeCondition += `월 ${policy.max_income}만원 이하`;
                }
            }

            let regionCondition = '';
            if (policy.region && policy.region.length > 0) {
                regionCondition = ` | 지역: ${policy.region.join(', ')}`;
            }

            policyElement.innerHTML = `
                <h5 class="mb-1">${policy.name}</h5>
                <p class="mb-1">${policy.description}</p>
                <small>나이 조건: 만 ${policy.min_age}세 ~ ${policy.max_age}세${incomeCondition}${regionCondition}</small>
            `;
            policyList.appendChild(policyElement);
        });
    }
});
