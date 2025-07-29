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

    // 새로 추가된 입력 필드 요소들
    const policyJurMnofNmInput = document.getElementById('policy-jur-mnof-nm');
    const policyJurOrgNmInput = document.getElementById('policy-jur-org-nm');
    const policyLifeArrayInput = document.getElementById('policy-life-array');
    const policyOnapPsbltYnInput = document.getElementById('policy-onap-psblt-yn');
    const policyRprsCtadrInput = document.getElementById('policy-rprs-ctadr');
    const policyServDtlLinkInput = document.getElementById('policy-serv-dtl-link');
    const policySprtCycNmInput = document.getElementById('policy-sprt-cyc-nm');
    const policySrvPvsnNmInput = document.getElementById('policy-srv-pvsn-nm');
    const policySvcfrstRegTsInput = document.getElementById('policy-svcfrst-reg-ts');
    const policyTrgterIndvdlArrayInput = document.getElementById('policy-trgter-indvdl-array');
    const policyInqNumInput = document.getElementById('policy-inq-num');
    const policyIntrsThemaArrayInput = document.getElementById('policy-intrs-thema-array');

    // 새로 추가된 상세 내용 필드 요소들
    const policyTgtrDtlCnInput = document.getElementById('policy-tgtr-dtl-cn');
    const policySlctCritCnInput = document.getElementById('policy-slct-crit-cn');
    const policyAlwServCnInput = document.getElementById('policy-alw-serv-cn');

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
                        <br>
                        담당부처: ${policy.jur_mnof_nm || '-'} | 생애주기: ${policy.life_array || '-'} | 대상: ${policy.trgter_indvdl_array || '-'}
                        <br>
                        상세링크: <a href="${policy.serv_dtl_link}" target="_blank">${policy.serv_dtl_link || '-'}</a>
                        <br>
                        대상 상세: ${policy.tgtr_dtl_cn || '-'}
                        <br>
                        선정 기준: ${policy.slct_crit_cn || '-'}
                        <br>
                        지원 내용: ${policy.alw_serv_cn || '-'}
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
            id: policyIdInput.value || undefined, // ID가 없으면 Supabase가 자동 생성 (text 타입이므로 직접 지정)
            name: policyNameInput.value,
            description: policyDescriptionInput.value,
            min_age: policyMinAgeInput.value ? parseInt(policyMinAgeInput.value, 10) : null,
            max_age: policyMaxAgeInput.value ? parseInt(policyMaxAgeInput.value, 10) : null,
            min_income: policyMinIncomeInput.value ? parseInt(policyMinIncomeInput.value, 10) : null,
            max_income: policyMaxIncomeInput.value ? parseInt(policyMaxIncomeInput.value, 10) : null,
            region: policyRegionInput.value ? policyRegionInput.value.split(',').map(r => r.trim()) : null,
            // 새로 추가된 필드들
            jur_mnof_nm: policyJurMnofNmInput.value || null,
            jur_org_nm: policyJurOrgNmInput.value || null,
            life_array: policyLifeArrayInput.value || null,
            onap_psblt_yn: policyOnapPsbltYnInput.value || null,
            rprs_ctadr: policyRprsCtadrInput.value || null,
            serv_dtl_link: policyServDtlLinkInput.value || null,
            sprt_cyc_nm: policySprtCycNmInput.value || null,
            srv_pvsn_nm: policySrvPvsnNmInput.value || null,
            svcfrst_reg_ts: policySvcfrstRegTsInput.value || null,
            trgter_indvdl_array: policyTrgterIndvdlArrayInput.value || null,
            inq_num: policyInqNumInput.value ? parseInt(policyInqNumInput.value, 10) : null,
            intrs_thema_array: policyIntrsThemaArrayInput.value || null,
            // 새로 추가된 상세 내용 필드들
            tgtr_dtl_cn: policyTgtrDtlCnInput.value || null,
            slct_crit_cn: policySlctCritCnInput.value || null,
            alw_serv_cn: policyAlwServCnInput.value || null
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
                const errorData = await response.json();
                throw new Error(errorData.message || '정책 저장에 실패했습니다.');
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
        // 새로 추가된 입력 필드 초기화
        policyJurMnofNmInput.value = '';
        policyJurOrgNmInput.value = '';
        policyLifeArrayInput.value = '';
        policyOnapPsbltYnInput.value = '';
        policyRprsCtadrInput.value = '';
        policyServDtlLinkInput.value = '';
        policySprtCycNmInput.value = '';
        policySrvPvsnNmInput.value = '';
        policySvcfrstRegTsInput.value = '';
        policyTrgterIndvdlArrayInput.value = '';
        policyInqNumInput.value = '';
        policyIntrsThemaArrayInput.value = '';
        // 새로 추가된 상세 내용 필드 초기화
        policyTgtrDtlCnInput.value = '';
        policySlctCritCnInput.value = '';
        policyAlwServCnInput.value = '';
    }

    // 정책 수정 모드
    async function editPolicy(id) {
        const response = await fetch(`/api/policies/${id}`); // 특정 정책 가져오는 API 사용
        const policyToEdit = await response.json();

        if (policyToEdit) {
            editingPolicyId = policyToEdit.id;
            policyIdInput.value = policyToEdit.id;
            policyNameInput.value = policyToEdit.name;
            policyDescriptionInput.value = policyToEdit.description;
            policyMinAgeInput.value = policyToEdit.min_age || '';
            policyMaxAgeInput.value = policyToEdit.max_age || '';
            policyMinIncomeInput.value = policyToEdit.min_income || '';
            policyMaxIncomeInput.value = policyToEdit.max_income || '';
            policyRegionInput.value = policyToEdit.region ? policyToEdit.region.join(',') : '';
            cancelEditButton.style.display = 'inline-block';

            // 새로 추가된 필드 값 채우기
            policyJurMnofNmInput.value = policyToEdit.jur_mnof_nm || '';
            policyJurOrgNmInput.value = policyToEdit.jur_org_nm || '';
            policyLifeArrayInput.value = policyToEdit.life_array || '';
            policyOnapPsbltYnInput.value = policyToEdit.onap_psblt_yn || '';
            policyRprsCtadrInput.value = policyToEdit.rprs_ctadr || '';
            policyServDtlLinkInput.value = policyToEdit.serv_dtl_link || '';
            policySprtCycNmInput.value = policyToEdit.sprt_cyc_nm || '';
            policySrvPvsnNmInput.value = policyToEdit.srv_pvsn_nm || '';
            policySvcfrstRegTsInput.value = policyToEdit.svcfrst_reg_ts || '';
            policyTrgterIndvdlArrayInput.value = policyToEdit.trgter_indvdl_array || '';
            policyInqNumInput.value = policyToEdit.inq_num || '';
            policyIntrsThemaArrayInput.value = policyToEdit.intrs_thema_array || '';
            // 새로 추가된 상세 내용 필드 채우기
            policyTgtrDtlCnInput.value = policyToEdit.tgtr_dtl_cn || '';
            policySlctCritCnInput.value = policyToEdit.slct_crit_cn || '';
            policyAlwServCnInput.value = policyToEdit.alw_serv_cn || '';

        } else {
            alert('정책을 찾을 수 없습니다.');
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
                    const errorData = await response.json();
                    throw new Error(errorData.message || '정책 삭제에 실패했습니다.');
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