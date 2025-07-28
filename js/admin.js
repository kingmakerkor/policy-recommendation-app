document.addEventListener('DOMContentLoaded', () => {
    const policyForm = document.getElementById('policy-form');
    const policyIdInput = document.getElementById('policy-id');
    const policyNameInput = document.getElementById('policy-name');
    const policyDescriptionInput = document.getElementById('policy-description');
    const policyMinAgeInput = document.getElementById('policy-min-age');
    const policyMaxAgeInput = document.getElementById('policy-max-age');
    const policyMinIncomeInput = document.getElementById('policy-min-income');
    const policyMaxIncomeInput = document.getElementById('policy-max-income');
    const policyRegionInput = document.getElementById('policy-region');
    const policyListDiv = document.getElementById('policy-list');
    const cancelEditButton = document.getElementById('cancel-edit');

    let editingPolicyId = null;

    // 정책 목록 불러오기
    async function fetchPolicies() {
        try {
            const response = await fetch('/api/policies');
            const policies = await response.json();
            displayPolicies(policies);
        } catch (error) {
            console.error('Error fetching policies:', error);
            policyListDiv.innerHTML = '<div class="alert alert-danger">정책을 불러오는 데 실패했습니다.</div>';
        }
    }

    // 정책 목록 화면에 표시
    function displayPolicies(policies) {
        policyListDiv.innerHTML = '';
        if (policies.length === 0) {
            policyListDiv.innerHTML = '<div class="alert alert-info">등록된 정책이 없습니다.</div>';
            return;
        }

        policies.forEach(policy => {
            const policyElement = document.createElement('div');
            policyElement.className = 'policy-item list-group-item';
            policyElement.innerHTML = `
                <div>
                    <h5>${policy.name}</h5>
                    <p>${policy.description}</p>
                    <small>
                        나이: ${policy.min_age || '-'} ~ ${policy.max_age || '-'}세
                        ${(policy.min_income !== undefined || policy.max_income !== undefined) ? ` | 소득: ${policy.min_income || '-'} ~ ${policy.max_income || '-'}만원` : ''}
                        ${(policy.region && policy.region.length > 0) ? ` | 지역: ${policy.region.join(', ')}` : ''}
                    </small>
                </div>
                <div class="policy-actions">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${policy.id}">수정</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${policy.id}">삭제</button>
                </div>
            `;
            policyListDiv.appendChild(policyElement);
        });

        // 수정/삭제 버튼 이벤트 리스너 추가
        policyListDiv.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => editPolicy(e.target.dataset.id));
        });
        policyListDiv.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deletePolicy(e.target.dataset.id));
        });
    }

    // 정책 추가/수정 폼 제출
    policyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const policyData = {
            name: policyNameInput.value,
            description: policyDescriptionInput.value,
            min_age: policyMinAgeInput.value ? parseInt(policyMinAgeInput.value, 10) : undefined,
            max_age: policyMaxAgeInput.value ? parseInt(policyMaxAgeInput.value, 10) : undefined,
            min_income: policyMinIncomeInput.value ? parseInt(policyMinIncomeInput.value, 10) : undefined,
            max_income: policyMaxIncomeInput.value ? parseInt(policyMaxIncomeInput.value, 10) : undefined,
            region: policyRegionInput.value ? policyRegionInput.value.split(',').map(r => r.trim()) : undefined
        };

        try {
            let response;
            if (editingPolicyId) {
                // 수정
                response = await fetch(`/api/policies/${editingPolicyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(policyData)
                });
            } else {
                // 추가
                response = await fetch('/api/policies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(policyData)
                });
            }

            if (!response.ok) {
                throw new Error('정책 저장에 실패했습니다.');
            }

            resetForm();
            fetchPolicies();
        } catch (error) {
            console.error('Error saving policy:', error);
            alert('정책 저장 중 오류가 발생했습니다: ' + error.message);
        }
    });

    // 폼 초기화
    function resetForm() {
        policyForm.reset();
        policyIdInput.value = '';
        editingPolicyId = null;
        cancelEditButton.style.display = 'none';
    }

    // 정책 수정 모드
    async function editPolicy(id) {
        const policies = await (await fetch('/api/policies')).json();
        const policyToEdit = policies.find(p => p.id === parseInt(id));

        if (policyToEdit) {
            editingPolicyId = policyToEdit.id;
            policyIdInput.value = policyToEdit.id;
            policyNameInput.value = policyToEdit.name;
            policyDescriptionInput.value = policyToEdit.description;
            policyMinAgeInput.value = policyToEdit.min_age || '';
            policyMaxAgeInput.value = policyToEdit.max_age || '';
            policyMinIncomeInput.value = policyToEdit.min_income || '';
            policyMaxIncomeInput.value = policyToEdit.max_income || '';
            policyRegionInput.value = policyToEdit.region ? policyToEdit.region.join(', ') : '';
            cancelEditButton.style.display = 'inline-block';
        }
    }

    // 수정 취소 버튼
    cancelEditButton.addEventListener('click', resetForm);

    // 정책 삭제
    async function deletePolicy(id) {
        if (confirm('정말로 이 정책을 삭제하시겠습니까?')) {
            try {
                const response = await fetch(`/api/policies/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('정책 삭제에 실패했습니다.');
                }
                fetchPolicies();
            } catch (error) {
                console.error('Error deleting policy:', error);
                alert('정책 삭제 중 오류가 발생했습니다: ' + error.message);
            }
        }
    }

    // 페이지 로드 시 정책 목록 불러오기
    fetchPolicies();
});
