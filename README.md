[README.md](https://github.com/user-attachments/files/28754649/README.md)[Uploading READM# Checklist de Acessos — Porto Vale

Sistema web para controle e registro de checklists de acessos de colaboradores (gerentes e vendedores), com autenticação via Firebase, histórico em tempo real e exportação de dados.

## Funcionalidades

- **Autenticação Firebase** — login com usuário e senha (email/password)
- **Dois perfis de checklist** — Gerente (14 acessos) e Vendedor (5 acessos)
- **Progresso em tempo real** — barra de progresso com percentual de itens concluídos
- **Salvar no Firestore** — todos os registros ficam na nuvem, acessíveis por múltiplos usuários simultaneamente
- **Continuar preenchimento** — registros incompletos podem ser retomados de onde pararam
- **Histórico com filtros** — visualização de todos os registros com stats (total, gerentes, vendedores, média de conclusão)
- **Modal de detalhes** — visualização completa de qualquer registro
- **Exportar .xlsx** — planilha completa com abas por tipo de colaborador + resumo
- **Gerar imagem** — snapshot do checklist em PNG para envio via WhatsApp/e-mail
- **Log de auditoria** — todas as ações são registradas na coleção `checklist_auditoria`

## Credenciais de acesso

| Usuário | Email completo |
|---|---|
| `admin` | admin@portovale.com |
| `rh` | rh@portovale.com |
| `gerencia` | gerencia@portovale.com |

> Senhas configuradas diretamente no Firebase Authentication Console.

## Tecnologias

- HTML5 + CSS3 + JavaScript (ESModules)
- [Firebase v10](https://firebase.google.com/) — Auth + Firestore
- [SheetJS (xlsx)](https://sheetjs.com/) — exportação de planilhas
- [html2canvas](https://html2canvas.hertzen.com/) — geração de imagem PNG

## Configuração Firebase

O projeto usa o projeto Firebase `checklist-87b39`. As configurações estão em `index.html`:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "checklist-87b39.firebaseapp.com",
  projectId: "checklist-87b39",
  ...
};
```

### Regras do Firestore recomendadas

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /checklist_registros/{doc} {
      allow read, write: if request.auth != null;
    }
    match /checklist_auditoria/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Como usar localmente

Por ser um arquivo HTML único com módulos ES (Firebase SDK via CDN), é necessário servir via HTTP — não abrindo diretamente como `file://`.

```bash
# Com Python
python3 -m http.server 8080

# Com Node.js (npx)
npx serve .
```

Acesse `http://localhost:8080`.

## Deploy (GitHub Pages)

1. Faça push do repositório para o GitHub
2. Acesse **Settings → Pages**
3. Selecione a branch `main` e pasta `/ (root)`
4. O site ficará disponível em `https://<seu-usuario>.github.io/<repo>/`

## Estrutura do projeto

```
portovale-checklist/
├── index.html   # Aplicação completa (single-file)
└── README.md
```

---

Porto Vale · Gestão de Acessos
E.md…]()
