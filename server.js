const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const POLICIES_FILE = path.join(__dirname, 'data', 'policies.json');

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // 정적 파일 제공 (index.html, css, js 등)

// 정책 데이터 읽기
const readPolicies = () => {
    try {
        const data = fs.readFileSync(POLICIES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading policies file:', error);
        return [];
    }
};

// 정책 데이터 쓰기
const writePolicies = (policies) => {
    try {
        fs.writeFileSync(POLICIES_FILE, JSON.stringify(policies, null, 4), 'utf8');
    } catch (error) {
        console.error('Error writing policies file:', error);
    }
};

// API Endpoints

// 모든 정책 가져오기
app.get('/api/policies', (req, res) => {
    const policies = readPolicies();
    res.json(policies);
});

// 정책 추가
app.post('/api/policies', (req, res) => {
    const policies = readPolicies();
    const newPolicy = req.body;
    newPolicy.id = policies.length > 0 ? Math.max(...policies.map(p => p.id)) + 1 : 1;
    policies.push(newPolicy);
    writePolicies(policies);
    res.status(201).json(newPolicy);
});

// 정책 수정
app.put('/api/policies/:id', (req, res) => {
    const policies = readPolicies();
    const policyId = parseInt(req.params.id);
    const updatedPolicy = req.body;

    const index = policies.findIndex(p => p.id === policyId);
    if (index !== -1) {
        policies[index] = { ...policies[index], ...updatedPolicy, id: policyId }; // ID는 변경되지 않도록
        writePolicies(policies);
        res.json(policies[index]);
    } else {
        res.status(404).send('Policy not found');
    }
});

// 정책 삭제
app.delete('/api/policies/:id', (req, res) => {
    let policies = readPolicies();
    const policyId = parseInt(req.params.id);

    const initialLength = policies.length;
    policies = policies.filter(p => p.id !== policyId);

    if (policies.length < initialLength) {
        writePolicies(policies);
        res.status(204).send(); // No Content
    } else {
        res.status(404).send('Policy not found');
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
