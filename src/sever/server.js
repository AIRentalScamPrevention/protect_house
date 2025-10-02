const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());           // 개발 중 다른 포트에서 호출 허용
app.use(express.json());   // JSON Body 파싱

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '비밀번호',
    database: 'appdb',
});

// 드롭다운 옵션: 계약/주택
app.get('/api/options', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const [contracts] = await conn.query(
            'SELECT id, code, label_ko FROM contract_types WHERE is_active=1 ORDER BY id'
        );
        const [properties] = await conn.query(
            'SELECT id, code, label_ko FROM property_types WHERE is_active=1 ORDER BY id'
        );
        res.json({ contracts, properties });
    } finally {
        conn.release();
    }
});

// 회원가입
app.post('/api/signup', async (req, res) => {
    const {
        nickname, email, username, password,
        contract_type_id, property_type_id,   // 숫자 또는 null
    } = req.body;

    if (!nickname || !email || !username || !password) {
        return res.status(400).json({ ok:false, msg:'필수 값 누락' });
    }

    try {
        const sql = `
      INSERT INTO users
        (nickname, email, username, password, contract_type_id, property_type_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const params = [
            nickname,
            email,
            username,
            password,
            contract_type_id ?? null,
            property_type_id ?? null,
        ];
        const [r] = await pool.execute(sql, params);
        return res.json({ ok:true, user_id: r.insertId });
    } catch (err) {
        // UNIQUE 제약/ FK 오류 등
        console.error(err);
        return res.status(500).json({ ok:false, msg:'DB 오류', detail: err.code || String(err) });
    }
});

app.listen(3000, () => console.log('✅ API on http://localhost:3000'));
