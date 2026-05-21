pipeline {
  agent any

  environment {
    APP_NAME = 'nest-node-service'
    DEPLOY_DIR = '/opt/nest-node-service'
    // Jenkins 与应用在同一台 ECS 时设为 true（当前推荐）
    LOCAL_DEPLOY = 'true'
    // LOCAL_DEPLOY=false 时使用 SSH 远程部署
    SSH_CREDENTIALS = 'ecs-ssh-key'
    DEPLOY_USER = 'root'
    DEPLOY_HOST = '127.0.0.1'
  }

  stages {
    stage('Checkout') {
      steps {
        // 从 Jenkins 任务配置的 Git 仓库拉取 main 最新代码（GitHub）
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
        script {
          if (env.LOCAL_DEPLOY == 'true') {
            // 同机部署：同步到 /opt 并重启 PM2（不覆盖 .env.production）
            sh '''
              set -e
              echo "==> Local deploy to ${DEPLOY_DIR}..."
              rsync -avz --delete \
                --exclude node_modules \
                --exclude .git \
                --exclude .env.local \
                --exclude .env.production \
                --exclude coverage \
                ./ ${DEPLOY_DIR}/
              APP_DIR=${DEPLOY_DIR} bash ${DEPLOY_DIR}/scripts/deploy.sh
            '''
          } else {
            sshagent(credentials: [env.SSH_CREDENTIALS]) {
              sh '''
                set -e
                echo "==> Remote deploy to ${DEPLOY_HOST}..."
                rsync -avz --delete \
                  --exclude node_modules \
                  --exclude .git \
                  --exclude .env.local \
                  --exclude .env.production \
                  --exclude coverage \
                  ./ ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/
                ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} \
                  "APP_DIR=${DEPLOY_DIR} bash ${DEPLOY_DIR}/scripts/deploy.sh"
              '''
            }
          }
        }
      }
    }
  }

  post {
    success {
      echo 'Deploy succeeded.'
    }
    failure {
      echo 'Deploy failed.'
    }
  }
}
