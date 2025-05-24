// Script para gerar variáveis de ambiente no formato para colar no Render
const fs = require('fs');
const path = require('path');

// Lê o arquivo env.txt
const envPath = path.join(__dirname, 'env.txt');
const envContent = fs.readFileSync(envPath, 'utf8');

// Processa as linhas, removendo comentários e linhas vazias
const envVars = envContent.split('\n')
  .filter(line => !line.trim().startsWith('#') && line.trim() !== '')
  .map(line => {
    const parts = line.split('=');
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    return { key, value };
  });

// Gera saída formatada para o Render
console.log('Variáveis de ambiente para o Render:');
console.log('------------------------------------');
console.log('Copie e cole todas as linhas abaixo na área de "Bulk Add" do Render:');
console.log('');

// Formato para "Bulk Add" do Render (KEY=VALUE)
const bulkText = envVars.map(({ key, value }) => `${key}=${value}`).join('\n');
console.log(bulkText);

console.log('');
console.log('OU adicione cada variável individualmente:');
console.log('');

// Formato individual para referência
envVars.forEach(({ key, value }) => {
  console.log(`Chave: ${key}`);
  console.log(`Valor: ${value}`);
  console.log('---');
});

console.log('');
console.log('Instruções:');
console.log('1. No painel do Render, vá para seu serviço web');
console.log('2. Clique na aba "Environment"');
console.log('3. Role até "Environment Variables"');
console.log('4. Clique em "Add Bulk"');
console.log('5. Cole todas as linhas no formato KEY=VALUE');
console.log('6. Clique em "Save Changes" e depois em "Deploy"'); 