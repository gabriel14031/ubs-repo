START TRANSACTION;

INSERT INTO paciente (nome_completo, email)
SELECT 'Maria da Silva', 'paciente.teste.tts@example.test'
WHERE NOT EXISTS (
    SELECT 1
    FROM paciente
    WHERE email = 'paciente.teste.tts@example.test'
);

INSERT INTO medico (nome_completo, especialidade, crm, email, telefone, ativo)
SELECT 'Ana Souza (Teste TTS)', 'Clínica Geral', '99999SP',
       'medico.teste.tts@example.test', '', b'1'
WHERE NOT EXISTS (
    SELECT 1
    FROM medico
    WHERE email = 'medico.teste.tts@example.test'
       OR crm = '99999SP'
);

INSERT INTO agendamento (
    data_hora_consulta, status, observacoes, tipo_consulta, paciente_id, medico_id
)
SELECT TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '09:30:00'),
       'AGENDADO',
       'Dados fictícios para testar a leitura TTS.',
       'Consulta Clínica Geral',
       p.id,
       m.id
FROM paciente p
JOIN medico m ON m.email = 'medico.teste.tts@example.test'
WHERE p.email = 'paciente.teste.tts@example.test'
  AND NOT EXISTS (
      SELECT 1
      FROM agendamento a
      WHERE a.paciente_id = p.id
        AND a.medico_id = m.id
        AND a.observacoes = 'Dados fictícios para testar a leitura TTS.'
  );

COMMIT;

SELECT a.id AS agendamento_id,
       p.nome_completo AS paciente,
       m.nome_completo AS medico,
       a.data_hora_consulta,
       a.tipo_consulta,
       a.status
FROM agendamento a
JOIN paciente p ON p.id = a.paciente_id
JOIN medico m ON m.id = a.medico_id
WHERE p.email = 'paciente.teste.tts@example.test'
  AND m.email = 'medico.teste.tts@example.test'
  AND a.observacoes = 'Dados fictícios para testar a leitura TTS.';
