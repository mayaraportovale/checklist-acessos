# ✦ Checklist de Acessos — Porto Vale

Formulário interativo para registrar o encerramento de acessos de **Gerentes** e **Vendedores**.

## Funcionalidades

- Seleção de tipo: **Gerente** (14 acessos) ou **Vendedor** (5 acessos)
- Campos: nome, responsável, data e motivo
- Checklist com progresso em tempo real
- **Histórico salvo localmente** no navegador (localStorage)
- Visualização detalhada de cada registro
- Interface responsiva para desktop e mobile

## Como publicar no GitHub Pages

### 1. Criar o repositório

1. Acesse [github.com/new](https://github.com/new)
2. Dê um nome ao repositório (ex: `checklist-acessos`)
3. Deixe como **Public**
4. Clique em **Create repository**

### 2. Fazer upload dos arquivos

Faça upload dos 3 arquivos pelo próprio GitHub:
- `index.html`
- `style.css`
- `app.js`

Ou via terminal:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/checklist-acessos.git
git push -u origin main
```

### 3. Ativar o GitHub Pages

1. No repositório, vá em **Settings**
2. Menu lateral: **Pages**
3. Em *Branch*, selecione `main` e pasta `/ (root)`
4. Clique em **Save**

Após alguns minutos, o site estará disponível em:
```
https://SEU_USUARIO.github.io/checklist-acessos/
```

---

> O histórico fica salvo no navegador de cada usuário via `localStorage`.
