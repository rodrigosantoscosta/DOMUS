// Define o banco isolado para testes unitarios e E2E, protegendo o dev.db
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'domus-test-jwt-secret';
