# 🚗 Sistema de Controle de Abastecimento

Este projeto é uma aplicação **web em JavaScript puro** para gerenciar registros de abastecimento de veículos.  
O sistema permite **cadastro de usuários, login, registro de abastecimentos, filtros avançados, relatórios, exportação/importação de dados em CSV e JSON, além de geração de dados aleatórios para testes**.

---

## ✨ Funcionalidades

- 🔑 **Autenticação de usuários**
  - Cadastro e login de usuários com armazenamento no `localStorage`.
  - Controle de sessão persistente.

- ⛽ **Gerenciamento de abastecimentos**
  - Registro de novos abastecimentos com nome, data, combustível, litros e local.
  - Edição e exclusão de registros.
  - Geração de registros aleatórios para testes.

- 📊 **Relatórios e análises**
  - Tabela com filtros por nome, data, período e últimos X dias.
  - Relatório de pessoas com totais e médias de litros.
  - Gráfico interativo (via [Chart.js](https://www.chartjs.org/)) mostrando consumo por pessoa.
  - Resumo do período, total geral e destaque para o maior abastecedor.

- 💾 **Importação e exportação**
  - Exportação de dados em **CSV**.
  - Importação de dados em **CSV**.
  - Backup e restauração de dados em **JSON**.
  - Exportação de relatórios filtrados.

- 🎨 **Interface**
  - Interface com **Bootstrap 5**.
  - Alertas dinâmicos para feedback ao usuário.
  - Modal para edição de registros.

---

## 🛠️ Tecnologias utilizadas

- **HTML5** e **CSS3** (com [Bootstrap 5](https://getbootstrap.com/))
- **JavaScript Vanilla (ES6+)**
- **Chart.js** (para gráficos)
- **LocalStorage** para persistência dos dados

---

## 🚀 Como usar

1. Clone ou baixe o repositório:
   ```bash
   git clone https://github.com/seu-usuario/controle-abastecimento.git

Abra o arquivo index.html no navegador.

Crie uma conta ou faça login.

🔮 Funcionalidades futuras (sugestões)

Integração com banco de dados real (MySQL, MongoDB ou Firebase).

Controle de custos (R$) além dos litros.

Exportação para PDF.

Dashboard mais avançado com múltiplos gráficos.

Suporte a múltiplos combustíveis com preços.

📜 Licença

Este projeto é open-source sob a licença MIT.
Sinta-se à vontade para usar, modificar e contribuir! 🚀

Cadastre abastecimentos e explore os relatórios.