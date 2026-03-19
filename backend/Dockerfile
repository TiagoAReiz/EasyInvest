FROM python:3.11-slim

# Define diretório de trabalho
WORKDIR /app

# Variáveis de ambiente para não gerar .pyc e logs diretos
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Instalar dependências de sistema (para o psycopg2 compilar corretamente se não achar binary)
RUN apt-get update \
    && apt-get -y install libpq-dev gcc \
    && pip install --no-cache-dir --upgrade pip

# Instalar as dependências do Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# O código fonte será montado como volume no docker-compose e uvicorn rodará pelo comando lá.
# Opcional: Copiar o código para dentro caso rode sem compose no futuro.
COPY . .

EXPOSE 8000

# Comando padrão para produção (Azure Container Apps)
# Em dev local, o docker-compose sobrescreve com --reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
