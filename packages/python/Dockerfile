FROM debian:buster-slim

RUN apt-get update
RUN apt-get install -y --no-install-recommends make build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev

ENV HOME="/root"
WORKDIR ${HOME}
RUN apt-get install -y git
RUN git clone --depth=1 https://github.com/pyenv/pyenv.git .pyenv
ENV PYENV_ROOT="${HOME}/.pyenv"
ENV PATH="${PYENV_ROOT}/shims:${PYENV_ROOT}/bin:${PATH}"

ENV PYTHON_VERSION=3.8.6
RUN pyenv install ${PYTHON_VERSION}
RUN pyenv global ${PYTHON_VERSION}

RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -

WORKDIR /app

RUN apt-get install -y mecab-ipadic-utf8
RUN touch /usr/local/etc/mecabrc

COPY poetry.lock pyproject.toml ./
RUN /bin/bash -c 'source $HOME/.poetry/env && POETRY_VIRTUALENVS_IN_PROJECT=true poetry install --no-dev --no-root'

COPY . .

ENTRYPOINT [ "/bin/bash", "-c", "source .venv/bin/activate && uvicorn server:app --host=0.0.0.0" ]
