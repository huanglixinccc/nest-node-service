pipeline {
  agent any

  environment {
    APP_NAME = 'nest-node-service'
    // ECS 上的部署目录，按实际情况修改
    DEPLOY_DIR = '/opt/nest-node-service'
    // Jenkins Credentials 中配置的 SSH 私钥 ID
    SSH_CREDENTIALS = 'ecs-ssh-key'
    // ECS 登录用户，阿里云 Linux 一般为 root 或 ecs-user
    DEPLOY_USER = 'root'
    // ECS 公网 IP 或内网 IP（Jenkins 与 ECS 同 VPC 时用内网）
    DEPLOY_HOST = 'your-ecs-ip'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'node -v && npm -v'
        sh 'npm ci'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Deploy') {
      when {
        branch 'main'
      }
      steps {
        sshagent(credentials: [env.SSH_CREDENTIALS]) {
          sh '''
            set -e
            echo "==> Sync files to ECS..."
            rsync -avz --delete \
              --exclude node_modules \
              --exclude .git \
              --exclude .env.local \
              --exclude coverage \
              --exclude test \
              ./ ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/

            echo "==> Run deploy script on ECS..."
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} \
              "APP_DIR=${DEPLOY_DIR} bash ${DEPLOY_DIR}/scripts/deploy.sh"
          '''
        }
      }
    }
  }

  post {
    success {
      echo 'Pipeline succeeded.'
    }
    failure {
      echo 'Pipeline failed.'
    }
  }
}
