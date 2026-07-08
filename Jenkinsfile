pipeline {
    agent any

    tools {
    nodejs 'NodeJS-22'
}

    stages {

        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Verify Project Structure') {
            steps {
                sh 'pwd'
                sh 'ls -la'
                sh 'ls -la app'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t todo-app:latest ./app'
            }
        }

        stage('Verify Docker Image') {
            steps {
                sh 'docker images'
            }
        }
    }

    post {
        success {
            echo 'CI Pipeline executed successfully.'
        }

        failure {
            echo 'CI Pipeline failed.'
        }
    }
}