# 🛍️ Laurs Backend

Backend da plataforma **Laurs**, uma aplicação SaaS de e-commerce desenvolvida para pequenos negócios e empreendedores locais.

O backend é responsável por fornecer a API REST da aplicação, autenticação de usuários, gerenciamento de lojas e produtos, processamento de pedidos, integração com banco de dados e armazenamento de imagens.

## 🛠️ Tecnologias utilizadas

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL
* Supabase
* JWT
* bcrypt
* Multer
* Cloudinary
* Axios
* CORS
* dotenv
* ts-node-dev
## 📁 Estrutura do projeto

```text
Laurs-backend/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   ├── types/
│   └── server.ts
│
├── uploads/
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── tsconfig.json
```

### 📂 Organização das pastas

* **`config/`** — configurações utilizadas pela aplicação e integrações externas.
* **`controllers/`** — responsáveis por receber as requisições, executar as operações necessárias e retornar as respostas da API.
* **`middleware/`** — funções executadas durante o fluxo das requisições, incluindo validações e autenticação.
* **`prisma/`** — configuração e acesso ao Prisma utilizado pela aplicação.
* **`routes/`** — definição das rotas e endpoints da API.
* **`services/`** — concentra serviços e lógicas auxiliares da aplicação.
* **`types/`** — definição de tipos utilizados pelo TypeScript.
* **`server.ts`** — ponto de entrada responsável pela inicialização do servidor Express.
* **`prisma/`** — contém o schema responsável pela modelagem do banco de dados.
* **`uploads/`** — diretório utilizado no processo de recebimento de arquivos.
## 🏗️ Arquitetura da API

O backend do Laurs utiliza uma arquitetura baseada em **API REST**, separando responsabilidades entre rotas, middlewares, controllers, services e acesso ao banco de dados.

### 🔄 Fluxo de uma requisição

```text
Frontend
   ↓
HTTP Request
   ↓
Routes
   ↓
Middleware
   ↓
Controller
   ↓
Service / Prisma
   ↓
PostgreSQL
   ↓
Response
   ↓
Frontend
```

### 📌 Responsabilidade de cada camada

* **Routes** — definem os endpoints disponíveis na API.
* **Middleware** — processam informações antes que a requisição chegue ao controller, como autenticação através do JWT.
* **Controllers** — recebem a requisição e coordenam a operação solicitada.
* **Services** — concentram regras e operações específicas da aplicação.
* **Prisma** — realiza a comunicação entre a aplicação e o banco de dados PostgreSQL.
* **PostgreSQL / Supabase** — armazenam os dados da aplicação.
* **Response** — retorna os dados ou mensagens de erro para o frontend.

### 🔐 Exemplo de requisição autenticada

```text
Usuário faz login
       ↓
Backend valida email e senha
       ↓
JWT é gerado
       ↓
Frontend armazena o token
       ↓
Frontend envia o token nas requisições
       ↓
Middleware valida o JWT
       ↓
Controller processa a requisição
       ↓
Prisma acessa o banco
       ↓
Backend retorna a resposta
```
## 🌐 Principais endpoints da API

A API do Laurs é organizada por recursos, utilizando diferentes endpoints para autenticação, lojas, produtos, pedidos e administração.

### 🔐 Autenticação

```text
/auth
```

Responsável pelo cadastro e autenticação dos usuários.

Principais operações:

* Cadastro de usuário
* Login
* Geração de token JWT

### 🏪 Lojas

```text
/stores
```

Responsável pelo gerenciamento das lojas dos usuários.

Principais operações:

* Criar loja
* Consultar loja
* Gerenciar dados da loja
* Acessar informações da loja do usuário autenticado

### 📦 Produtos

```text
/products
```

Responsável pelo gerenciamento dos produtos.

Principais operações:

* Criar produtos
* Listar produtos
* Buscar produtos
* Filtrar produtos
* Atualizar produtos
* Gerenciar variantes
* Enviar imagens dos produtos

### 🛒 Pedidos

```text
/orders
```

Responsável pelo gerenciamento dos pedidos realizados na plataforma.

Principais operações:

* Criar pedidos
* Listar pedidos
* Consultar pedidos
* Atualizar status
* Cancelar pedidos

### 👑 Administração

```text
/admin
```

Responsável pelos recursos administrativos da plataforma.

Principais operações:

* Visualizar indicadores
* Consultar usuários
* Consultar lojas
* Consultar produtos
* Visualizar dados para o dashboard administrativo
## 🗄️ Banco de dados e Prisma

O Laurs utiliza **PostgreSQL** como banco de dados, hospedado através do **Supabase**, com o **Prisma ORM** responsável pela comunicação entre a aplicação e o banco.

A estrutura foi modelada para relacionar usuários, lojas, produtos e pedidos.

### 🧩 Principais entidades

* **User** — representa os usuários cadastrados na plataforma.
* **Store** — representa as lojas criadas pelos usuários.
* **Product** — representa os produtos cadastrados nas lojas.
* **ProductImage** — armazena as imagens relacionadas aos produtos.
* **ProductVariant** — representa variantes de produtos, como cor, tamanho e estoque.
* **Order** — representa os pedidos realizados.
* **OrderItem** — representa os produtos pertencentes a cada pedido.

### 🔗 Relacionamentos

```text id="f6x5w9"
User
 │
 └── Store
      │
      ├── Product
      │    ├── ProductImage
      │    └── ProductVariant
      │
      └── Order
           │
           └── OrderItem
                │
                └── Product
```

### 🔄 Fluxo de dados

Um usuário pode possuir uma loja, e a loja pode possuir diversos produtos e pedidos.

Cada produto pode possuir imagens e variantes, enquanto um pedido é composto por um ou mais itens relacionados aos produtos cadastrados.

O Prisma é utilizado para consultar, criar, atualizar e relacionar esses dados de forma tipada dentro da aplicação TypeScript.

## 🔐 Autenticação e segurança

O Laurs utiliza **JWT (JSON Web Token)** para autenticação dos usuários e proteção de recursos privados da API.

### 🔄 Fluxo de autenticação

```text id="8v3q2k"
Usuário
   ↓
Login
   ↓
Backend valida email e senha
   ↓
bcrypt verifica a senha
   ↓
JWT é gerado
   ↓
Frontend recebe o token
   ↓
Token é enviado nas requisições protegidas
   ↓
Middleware valida o token
   ↓
Acesso ao recurso autorizado
```

### 🛡️ Proteção das rotas

As rotas que precisam de autenticação utilizam middleware para verificar o token JWT antes de permitir o acesso ao recurso.

O token permite que o backend identifique o usuário autenticado e associe operações como criação de lojas, produtos e gerenciamento de pedidos ao usuário correto.

### 🔑 Senhas

As senhas dos usuários não são armazenadas diretamente no banco de dados.

O **bcrypt** é utilizado para realizar o hash das senhas e posteriormente verificar as credenciais durante o login.

### 🌐 Variáveis de ambiente

Informações sensíveis e configurações da aplicação são armazenadas em variáveis de ambiente através do **dotenv**.

Exemplos de configurações utilizadas:

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> O arquivo `.env` não deve ser enviado para o repositório público.

## 🖼️ Upload e armazenamento de imagens

O Laurs utiliza **Multer** para receber os arquivos enviados pelo frontend e **Cloudinary** para realizar o armazenamento das imagens dos produtos.

### 🔄 Fluxo do upload

```text id="3q5j8v"
Frontend
   ↓
FormData
   ↓
Multer
   ↓
Arquivo recebido pelo Backend
   ↓
Cloudinary
   ↓
URL da imagem
   ↓
Prisma
   ↓
ProductImage no banco
```

### 📦 Processo

1. O frontend envia as imagens através de `FormData`.
2. O **Multer** recebe e processa os arquivos enviados.
3. As imagens são enviadas para o **Cloudinary**.
4. O Cloudinary retorna a URL da imagem armazenada.
5. A URL é registrada no banco através do **Prisma**.
6. O produto passa a possuir suas imagens relacionadas através de `ProductImage`.

Esse processo permite separar o armazenamento dos arquivos dos dados estruturais mantidos no PostgreSQL.

## 🛒 Fluxo de pedidos

O backend gerencia o ciclo de vida dos pedidos realizados através da plataforma.

### 🔄 Fluxo

```text id="4r9m2p"
Produto
   ↓
Carrinho
   ↓
Criação do pedido
   ↓
Order
   ↓
OrderItem
   ↓
Atualização do status
```

### 📋 Status dos pedidos

Os pedidos podem passar pelos seguintes estados:

| Status       | Descrição                                |
| ------------ | ---------------------------------------- |
| `PENDING`    | Pedido criado e aguardando processamento |
| `PROCESSING` | Pedido em processamento                  |
| `SHIPPED`    | Pedido enviado                           |
| `COMPLETED`  | Pedido concluído                         |
| `CANCELLED`  | Pedido cancelado                         |

### 🔗 Relacionamento

Um `Order` pertence a uma loja e possui um ou mais `OrderItem`.

Cada `OrderItem` mantém a relação com o produto comprado, além de informações como quantidade e preço registrado no momento do pedido.

O backend também permite atualizar o status do pedido e cancelar pedidos que ainda estejam em uma etapa permitida do fluxo.

## 🚀 Instalação e execução

### 📋 Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

* Node.js
* npm
* PostgreSQL ou uma conexão com Supabase

### 📥 Instalação

Clone o repositório e entre na pasta do projeto:

```bash
git clone URL_DO_REPOSITORIO
cd Laurs-backend
```

Instale as dependências:

```bash
npm install
```

### 🔐 Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Preencha as variáveis com as configurações do seu ambiente.

> Nunca compartilhe os valores reais das variáveis de ambiente em repositórios públicos.

### 🗄️ Banco de dados

Após configurar a conexão com o PostgreSQL, execute:

```bash
npx prisma generate
```

Para aplicar as migrations existentes:

```bash
npx prisma migrate deploy
```

### ▶️ Executando o projeto

Para iniciar o servidor em ambiente de desenvolvimento:

```bash
npm run dev
```

O backend será executado na porta configurada pelo projeto.

### 🔎 Prisma Studio

Para visualizar e gerenciar os dados através do Prisma Studio:

```bash
npx prisma studio
```

## 🧠 Aprendizados e desafios

O desenvolvimento do backend do Laurs proporcionou experiência prática na construção de uma API REST utilizando Node.js, Express e TypeScript.

Durante o desenvolvimento, foram trabalhados conceitos como:

* Construção e organização de uma API REST
* Autenticação e autorização utilizando JWT
* Hash e validação de senhas com bcrypt
* Modelagem de banco de dados com Prisma
* Relacionamentos entre entidades
* Criação e gerenciamento de produtos e variantes
* Processamento de pedidos e seus diferentes status
* Upload e armazenamento de imagens
* Integração com Cloudinary
* Utilização de variáveis de ambiente
* Organização do projeto em controllers, routes, middleware e services
* Integração entre frontend, backend e banco de dados

Um dos principais desafios foi integrar diferentes partes da aplicação de forma que o fluxo completo funcionasse corretamente, desde a autenticação do usuário até o gerenciamento de produtos, carrinho e pedidos.

## 🌐 Links do projeto

### 💻 Repositórios

* **Frontend:** [Laurs Frontend](https://github.com/DaniLaurs/Laurs-frontend)
* **Backend:** [Laurs Backend](URL_DO_REPOSITORIO_BACKEND)

### 🚀 Aplicação

* **Frontend em produção:** [Laurs](URL_DO_FRONTEND_DEPLOY)
* **API em produção:** [Laurs API](URL_DA_API)

> Os links de produção serão atualizados com as URLs finais da aplicação.
