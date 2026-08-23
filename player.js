// player.js - Глобальный контроллер плеера
(function() {
    // Состояние плеера
    const state = {
        currentSong: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        audio: null
    };

    // DOM элементы мини-плеера (будут созданы динамически)
    let miniPlayer = null;
    let miniPlayBtn = null;
    let miniProgress = null;
    let miniTitle = null;
    let miniCloseBtn = null;

    // Создаём мини-плеер
    function createMiniPlayer() {
        if (document.getElementById('globalMiniPlayer')) return;

        miniPlayer = document.createElement('div');
        miniPlayer.id = 'globalMiniPlayer';
        miniPlayer.innerHTML = `
            <div class="mini-player">
                <div class="mini-player-info">
                    <img id="miniCover" src="" alt="cover" class="mini-cover">
                    <div class="mini-track-info">
                        <span id="miniTitle" class="mini-title">Нет трека</span>
                        <span id="miniArtist" class="mini-artist">51music</span>
                    </div>
                </div>
                <div class="mini-controls">
                    <button id="miniPlayBtn" class="mini-play-btn">▶</button>
                    <div class="mini-progress-wrap">
                        <div class="mini-progress-track">
                            <div id="miniProgressFill" class="mini-progress-fill"></div>
                        </div>
                    </div>
                    <span id="miniTime" class="mini-time">0:00</span>
                </div>
                <button id="miniCloseBtn" class="mini-close-btn">✕</button>
            </div>
        `;

        // Стили для мини-плеера
        const style = document.createElement('style');
        style.textContent = `
            #globalMiniPlayer {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                background: rgba(20, 15, 40, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 12px 16px;
                min-width: 300px;
                max-width: 420px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                transition: all 0.3s ease;
                display: none;
            }
            #globalMiniPlayer.visible {
                display: block;
            }
            #globalMiniPlayer .mini-player {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            #globalMiniPlayer .mini-player-info {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
                min-width: 0;
            }
            #globalMiniPlayer .mini-cover {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                object-fit: cover;
                flex-shrink: 0;
                background: #2a1f3d;
            }
            #globalMiniPlayer .mini-track-info {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            #globalMiniPlayer .mini-title {
                font-size: 0.85rem;
                font-weight: 600;
                color: #fff;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            #globalMiniPlayer .mini-artist {
                font-size: 0.7rem;
                color: #8b85a7;
            }
            #globalMiniPlayer .mini-controls {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            #globalMiniPlayer .mini-play-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: none;
                background: linear-gradient(135deg, #ff5500, #e64a00);
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: 0.2s;
                flex-shrink: 0;
            }
            #globalMiniPlayer .mini-play-btn:hover {
                transform: scale(1.05);
            }
            #globalMiniPlayer .mini-progress-wrap {
                width: 60px;
                flex-shrink: 0;
            }
            #globalMiniPlayer .mini-progress-track {
                height: 3px;
                border-radius: 10px;
                background: rgba(255,255,255,0.1);
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            #globalMiniPlayer .mini-progress-fill {
                height: 100%;
                width: 0%;
                border-radius: 10px;
                background: linear-gradient(90deg, #ff5500, #ff7a2f);
                transition: width 0.05s linear;
            }
            #globalMiniPlayer .mini-time {
                font-size: 0.7rem;
                color: #8b85a7;
                min-width: 32px;
                text-align: center;
                font-variant-numeric: tabular-nums;
            }
            #globalMiniPlayer .mini-close-btn {
                background: none;
                border: none;
                color: #4a4568;
                font-size: 1rem;
                cursor: pointer;
                padding: 0 4px;
                transition: 0.2s;
                flex-shrink: 0;
            }
            #globalMiniPlayer .mini-close-btn:hover {
                color: #ff5500;
            }
            @media (max-width: 500px) {
                #globalMiniPlayer {
                    bottom: 10px;
                    right: 10px;
                    left: 10px;
                    min-width: unset;
                    max-width: unset;
                    padding: 10px 12px;
                    border-radius: 12px;
                }
                #globalMiniPlayer .mini-progress-wrap {
                    width: 40px;
                }
                #globalMiniPlayer .mini-title {
                    font-size: 0.75rem;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(miniPlayer);

        // Сохраняем ссылки на элементы
        miniPlayBtn = document.getElementById('miniPlayBtn');
        miniProgress = document.getElementById('miniProgressFill');
        miniTitle = document.getElementById('miniTitle');
        miniCloseBtn = document.getElementById('miniCloseBtn');
        const miniCover = document.getElementById('miniCover');
        const miniTime = document.getElementById('miniTime');

        // Обработчики
        miniPlayBtn.addEventListener('click', togglePlay);
        miniCloseBtn.addEventListener('click', hideMiniPlayer);

        // Клик по прогрессу
        const track = miniPlayer.querySelector('.mini-progress-track');
        track.addEventListener('click', (e) => {
            if (!state.audio || !state.duration) return;
            const rect = track.getBoundingClientRect();
            const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            state.audio.currentTime = percent * state.duration;
        });
    }

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function togglePlay() {
        if (!state.audio) return;
        if (state.audio.paused) {
            state.audio.play().catch(() => {});
        } else {
            state.audio.pause();
        }
    }

    function updateMiniPlayer() {
        if (!miniTitle) return;
        if (state.currentSong) {
            miniTitle.textContent = state.currentSong.title || 'Без названия';
            const cover = document.getElementById('miniCover');
            if (cover) cover.src = state.currentSong.cover || '';
            document.getElementById('miniTime').textContent = formatTime(state.currentTime);
            miniProgress.style.width = state.duration > 0 ? (state.currentTime / state.duration * 100) + '%' : '0%';
            miniPlayBtn.textContent = state.isPlaying ? '⏸' : '▶';
        }
    }

    function showMiniPlayer(song) {
        createMiniPlayer();
        state.currentSong = song;
        document.getElementById('globalMiniPlayer').classList.add('visible');
        updateMiniPlayer();
    }

    function hideMiniPlayer() {
        if (state.audio) {
            state.audio.pause();
            state.isPlaying = false;
        }
        document.getElementById('globalMiniPlayer')?.classList.remove('visible');
        // Не удаляем аудио, чтобы можно было продолжить
    }

    // Главная функция для инициализации плеера с треком
    window.initGlobalPlayer = function(song, audioElement) {
        state.audio = audioElement;
        state.currentSong = song;

        // Подписываемся на события аудио
        audioElement.addEventListener('play', () => {
            state.isPlaying = true;
            updateMiniPlayer();
        });
        audioElement.addEventListener('pause', () => {
            state.isPlaying = false;
            updateMiniPlayer();
        });
        audioElement.addEventListener('timeupdate', () => {
            state.currentTime = audioElement.currentTime;
            state.duration = audioElement.duration || 0;
            updateMiniPlayer();
        });
        audioElement.addEventListener('loadedmetadata', () => {
            state.duration = audioElement.duration || 0;
            updateMiniPlayer();
        });
        audioElement.addEventListener('ended', () => {
            state.isPlaying = false;
            updateMiniPlayer();
        });

        // Показываем мини-плеер
        showMiniPlayer(song);
        updateMiniPlayer();
    };

    // Для совместимости со страницей песен
    window.getGlobalAudio = function() {
        return state.audio;
    };

    window.isGlobalPlayerActive = function() {
        return state.currentSong !== null;
    };

    // Восстанавливаем состояние при загрузке страницы
    window.addEventListener('load', () => {
        // Проверяем, есть ли активный трек в localStorage
        try {
            const saved = localStorage.getItem('globalPlayerState');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.song && data.isPlaying) {
                    // Восстанавливаем только если был активен
                    // Но аудио создаём заново
                }
            }
        } catch(e) {}
    });

    // Сохраняем состояние при изменениях
    setInterval(() => {
        if (state.currentSong && state.audio) {
            try {
                localStorage.setItem('globalPlayerState', JSON.stringify({
                    song: state.currentSong,
                    isPlaying: state.isPlaying,
                    currentTime: state.audio.currentTime,
                    volume: state.audio.volume
                }));
            } catch(e) {}
        }
    }, 3000);

})();
