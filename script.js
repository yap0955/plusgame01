class PlusGame {
    constructor() {
        this.score = 0;
        this.timeLimit = 5000; // 5초
        this.timer = null;
        this.currentAnswer = 0;
        this.failImage = new Image();
        this.failImage.src = 'assets/ggg.png';
        
        // 오디오 요소들 생성
        this.successSound = document.createElement('audio');
        this.failSound = document.createElement('audio');
        this.finalSuccessSound = document.createElement('audio');

        // 소스 설정
        this.successSound.src = 'assets/Ascending3.mp3';
        this.failSound.src = 'assets/fail_01.mp3';
        this.finalSuccessSound.src = 'assets/suc_01.mp3';

        // 볼륨 설정
        this.successSound.volume = 1.0;
        this.failSound.volume = 1.0;
        this.finalSuccessSound.volume = 1.0;

        // preload 설정
        this.successSound.preload = 'auto';
        this.failSound.preload = 'auto';
        this.finalSuccessSound.preload = 'auto';

        // 문서에 추가
        document.body.appendChild(this.successSound);
        document.body.appendChild(this.failSound);
        document.body.appendChild(this.finalSuccessSound);
        
        // 화면 요소
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen'),
            coupon: document.getElementById('coupon-screen')
        };
        
        // 게임 요소
        this.timerProgress = document.getElementById('timer-progress');
        this.scoreElement = document.getElementById('score');
        this.number1Element = document.getElementById('number1');
        this.number2Element = document.getElementById('number2');
        this.answerInput = document.getElementById('answer-input');
        
        // 버튼 이벤트 리스너 설정
        this.initializeEventListeners();
        
        // 오디오 컨텍스트 초기화
        this.initAudio();
    }

    initAudio() {
        // 오디오 컨텍스트 초기화
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();

        // 사용자 상호작용으로 오디오 잠금 해제
        const unlockAudio = () => {
            this.audioContext.resume();
            this.successSound.play().then(() => {
                this.successSound.pause();
                this.successSound.currentTime = 0;
            }).catch(e => console.log('Audio play failed:', e));
            document.removeEventListener('click', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
    }

    initializeEventListeners() {
        // 시작 버튼
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        
        // 확인 버튼
        document.getElementById('submit-button').addEventListener('click', () => this.checkAnswer());
        
        // 답안 입력 엔터 키
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });
        
        // 다시하기 버튼
        document.getElementById('retry-button').addEventListener('click', () => this.startGame());
        
        // 홈으로 버튼들
        document.querySelectorAll('#home-button, #coupon-home').forEach(button => {
            button.addEventListener('click', () => this.showScreen('start'));
        });
        
        // 쿠폰 저장 버튼
        document.getElementById('save-coupon').addEventListener('click', () => this.saveCoupon());
    }

    playSound(sound) {
        sound.currentTime = 0;
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Sound play error:', error);
                // 자동 재생 실패 시 클릭 이벤트에 바인딩
                const playOnClick = () => {
                    sound.play().catch(e => console.log('Retry failed:', e));
                    document.removeEventListener('click', playOnClick);
                };
                document.addEventListener('click', playOnClick);
            });
        }
    }

    generateProblem() {
        // 10~50 사이의 랜덤 숫자 생성
        const num1 = Math.floor(Math.random() * 41) + 10;
        const num2 = Math.floor(Math.random() * 41) + 10;
        
        this.number1Element.textContent = num1;
        this.number2Element.textContent = num2;
        this.currentAnswer = num1 + num2;
        
        // 입력 필드 초기화 및 포커스
        this.answerInput.value = '';
        this.answerInput.focus();
    }

    startTimer() {
        // 타이머 바 리셋
        this.timerProgress.style.width = '100%';
        
        // 이전 타이머 제거
        if (this.timer) clearTimeout(this.timer);
        
        // 새로운 타이머 시작
        const startTime = Date.now();
        
        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, this.timeLimit - elapsed);
            const percentage = (remaining / this.timeLimit) * 100;
            
            this.timerProgress.style.width = `${percentage}%`;
            
            if (remaining > 0) {
                requestAnimationFrame(updateTimer);
            } else {
                this.handleFailure('시간 초과!');
            }
        };
        
        requestAnimationFrame(updateTimer);
        this.timer = setTimeout(() => this.handleFailure('시간 초과!'), this.timeLimit);
    }

    checkAnswer() {
        const userAnswer = parseInt(this.answerInput.value);
        
        if (userAnswer === this.currentAnswer) {
            this.handleSuccess();
        } else {
            this.handleFailure('틀렸습니다!');
        }
    }

    handleSuccess() {
        clearTimeout(this.timer);
        this.score++;
        this.scoreElement.textContent = this.score;
        
        if (this.score === 3) {
            this.playSound(this.finalSuccessSound);
            this.showCoupon();
        } else {
            this.playSound(this.successSound);
            this.showSuccessMessage();
            setTimeout(() => {
                this.generateProblem();
                this.startTimer();
            }, 1000);
        }
    }

    handleFailure(message) {
        clearTimeout(this.timer);
        this.playSound(this.failSound);
        this.showFailureAnimation();
        
        const resultMessage = document.getElementById('result-message');
        resultMessage.textContent = message;
        
        setTimeout(() => {
            this.showScreen('result');
        }, 1000);
    }

    showFailureAnimation() {
        const failAnimation = document.createElement('div');
        failAnimation.style.position = 'absolute';
        failAnimation.style.left = '-100px';
        failAnimation.style.top = '50%';
        failAnimation.style.transform = 'translateY(-50%)';
        failAnimation.style.transition = 'left 4s linear';
        
        const failImg = this.failImage.cloneNode();
        failImg.style.width = '100px';
        failAnimation.appendChild(failImg);
        
        document.body.appendChild(failAnimation);
        
        // 강제 리플로우
        failAnimation.offsetHeight;
        
        failAnimation.style.left = '100%';
        
        setTimeout(() => {
            document.body.removeChild(failAnimation);
        }, 4000);
    }

    showSuccessMessage() {
        const message = document.createElement('div');
        message.textContent = '🎯 정답입니다!';
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.fontSize = '2rem';
        message.style.color = 'var(--success-color)';
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.3s';
        
        this.screens.game.appendChild(message);
        
        // 강제 리플로우
        message.offsetHeight;
        
        message.style.opacity = '1';
        
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                this.screens.game.removeChild(message);
            }, 300);
        }, 700);
    }

    showCoupon() {
        const canvas = document.getElementById('coupon-canvas');
        const ctx = canvas.getContext('2d');
        
        // 캔버스 크기 설정
        canvas.width = 300;
        canvas.height = 200;
        
        // 쿠폰 디자인
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'var(--primary-color)';
        ctx.font = 'bold 24px "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.fillText('🥤 음료수 1잔 무료 쿠폰', canvas.width/2, 70);
        
        ctx.font = '16px "Noto Sans KR"';
        ctx.fillText('축하합니다!', canvas.width/2, 100);
        ctx.fillText('3문제 연속 정답 달성!', canvas.width/2, 130);
        
        const date = new Date();
        ctx.font = '14px "Noto Sans KR"';
        ctx.fillText(`발급일: ${date.toLocaleDateString()}`, canvas.width/2, 170);
        
        this.showScreen('coupon');
    }

    saveCoupon() {
        const canvas = document.getElementById('coupon-canvas');
        const link = document.createElement('a');
        link.download = '음료수쿠폰.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    showScreen(screenName) {
        // 모든 화면 숨기기
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 요청된 화면 표시
        this.screens[screenName].classList.add('active');
        
        if (screenName === 'game') {
            this.score = 0;
            this.scoreElement.textContent = this.score;
            this.generateProblem();
            this.startTimer();
        }
    }

    startGame() {
        this.showScreen('game');
    }
}

// 게임 인스턴스 생성
const game = new PlusGame(); 