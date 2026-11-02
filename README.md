# AlertaPluvia_UPXI
Projeto acadêmico para monitoramento em tempo real de alagamentos urbanos com integração IoT e Firebase.

# 🌊 WaterBit - Sistema de Monitoramento e Proteção contra Alagamentos

> **Projeto Acadêmico** desenvolvido para monitoramento em tempo real de bueiros e prevenção de enchentes urbanas utilizando soluções IoT e Firebase.

---

## 📌 Sobre o Projeto

O **WaterBit** é uma aplicação web mobile-first desenvolvida com o objetivo de monitorar o nível de preenchimento e a vazão de bueiros urbanos. O sistema capta dados de sensores IoT em tempo real para alertar a população e as autoridades sobre áreas com risco potencial de alagamento.

Este projeto foi construído como parte de um **trabalho acadêmico**, integrando conceitos de Internet das Coisas (IoT), desenvolvimento web responsivo e banco de dados em tempo real.

---

## 🚀 Funcionalidades

- 📊 **Monitoramento em Tempo Real:** Leitura contínua dos dados de sensores IoT (distância e porcentagem de ocupação do bueiro) via Firebase Realtime Database.
- 🎨 **Interface Dinâmica:** Mudança automática do status visual (Normal, Atenção e Crítico) conforme a gravidade indicada pelos sensores.
- 🌙 **Modo Escuro / Claro:** Suporte a temas customizados (Claro, Escuro e Automático com base no horário).
- 🗺️ **Mapa Interativo (Simulado):** Visualização geográfica dos pontos monitorados e status de cada bueiro.
- 🔔 **Central de Alertas:** Listagem dos pontos em atenção e emergência na região.
- 📱 **Mobile First & Glassmorphism:** Design moderno pensado para smartphones, utilizando efeitos de transparência e respostas táteis rápidas.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3**
- **JavaScript (ES6+)**
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS para estilização ágil
- **[Firebase Realtime Database](https://firebase.google.com/)** - Sincronização de dados IoT ao vivo
- **[Phosphor Icons](https://phosphoricons.com/)** - Conjunto de ícones vetoriais
- **Hardware/IoT:** Sensores integrados via Firebase compatível (Ex: ESP32 / Arduino)

---

## 📂 Estrutura do Repositório

```text
├── index.html        # Estrutura e marcação da aplicação
├── style.css         # Estilização customizada e temas
└── script.js        # Lógica do app, manipulação de DOM e conexão com Firebase
