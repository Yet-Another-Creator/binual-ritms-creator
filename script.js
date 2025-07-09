document.addEventListener('DOMContentLoaded', () => {
    // Получаем ссылки на элементы DOM
    const carrierFrequencyInput = document.getElementById('carrierFrequency');
    const binauralFrequencyInput = document.getElementById('binauralFrequency');
    const volumeInput = document.getElementById('volume');
    const carrierValueSpan = document.getElementById('carrierValue');
    const binauralValueSpan = document.getElementById('binauralValue');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');

    let audioContext = null; // Контекст Web Audio API
    let oscillatorLeft = null; // Генератор для левого уха
    let oscillatorRight = null; // Генератор для правого уха
    let gainNode = null; // Узел для управления громкостью

    // Обновляем отображаемые значения частот при изменении ползунков
    carrierFrequencyInput.addEventListener('input', () => {
        carrierValueSpan.textContent = `${carrierFrequencyInput.value} Гц`;
    });

    binauralFrequencyInput.addEventListener('input', () => {
        binauralValueSpan.textContent = `${parseFloat(binauralFrequencyInput.value).toFixed(1)} Гц`;
    });

    // Функция для запуска генерации бинауральных ритмов
    startButton.addEventListener('click', () => {
        // Создаем новый AudioContext, если его еще нет или он был закрыт
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Создаем два осциллятора (генератора звука)
        oscillatorLeft = audioContext.createOscillator();
        oscillatorRight = audioContext.createOscillator();

        // Устанавливаем тип волны (синусоидальная)
        oscillatorLeft.type = 'sine';
        oscillatorRight.type = 'sine';

        // Создаем GainNode для управления громкостью
        gainNode = audioContext.createGain();
        gainNode.gain.value = volumeInput.value; // Устанавливаем начальную громкость

        // Создаем StereoPannerNode для разделения звука по каналам (лево/право)
        const pannerLeft = audioContext.createStereoPanner();
        pannerLeft.pan.value = -1; // -1 для левого канала

        const pannerRight = audioContext.createStereoPanner();
        pannerRight.pan.value = 1; // 1 для правого канала

        // Устанавливаем частоты
        const carrierFreq = parseFloat(carrierFrequencyInput.value);
        const binauralFreq = parseFloat(binauralFrequencyInput.value);

        oscillatorLeft.frequency.setValueAtTime(carrierFreq, audioContext.currentTime); // Левое ухо - основная частота
        oscillatorRight.frequency.setValueAtTime(carrierFreq + binauralFreq, audioContext.currentTime); // Правое ухо - основная + бинауральная

        // Соединяем узлы: осциллятор -> панорама -> громкость -> выход
        oscillatorLeft.connect(pannerLeft).connect(gainNode).connect(audioContext.destination);
        oscillatorRight.connect(pannerRight).connect(gainNode).connect(audioContext.destination);

        // Запускаем осцилляторы
        oscillatorLeft.start();
        oscillatorRight.start();

        // Отключаем кнопку "Начать" и включаем "Остановить"
        startButton.disabled = true;
        stopButton.disabled = false;
    });

    // Функция для остановки генерации бинауральных ритмов
    stopButton.addEventListener('click', () => {
        if (oscillatorLeft) {
            oscillatorLeft.stop();
            oscillatorLeft.disconnect();
            oscillatorLeft = null;
        }
        if (oscillatorRight) {
            oscillatorRight.stop();
            oscillatorRight.disconnect();
            oscillatorRight = null;
        }
        // Закрываем AudioContext для освобождения ресурсов
        if (audioContext) {
            audioContext.close().then(() => {
                audioContext = null;
            });
        }
        // Включаем кнопку "Начать" и отключаем "Остановить"
        startButton.disabled = false;
        stopButton.disabled = true;
    });

    // Обновляем громкость в реальном времени при изменении ползунка
    volumeInput.addEventListener('input', () => {
        if (gainNode) {
            gainNode.gain.value = volumeInput.value;
        }
    });

    // Добавляем обработчик для автоматического запуска AudioContext при взаимодействии пользователя
    // Это важно для совместимости с политиками автовоспроизведения браузеров
    document.body.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true }); // Выполнить один раз
});