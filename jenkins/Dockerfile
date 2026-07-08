FROM jenkins/jenkins:lts

USER root

RUN apt-get update && \
    apt-get install -y \
    docker.io \
    git \
    curl \
    unzip \
    libatomic1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Give jenkins user access to the docker socket without running Jenkins as root
RUN usermod -aG root jenkins

USER jenkins