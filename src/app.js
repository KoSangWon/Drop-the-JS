/* ==== DOMs ==== */
const $playBtn = document.querySelector('.play-btn');
const $musicPad = document.querySelector('.music');
// 임시
const $bpmInput = document.querySelector('#bpm-input');

/* ==== state ==== */
// const MAX_BEAT = 32; // 최대 비트
const MIN_TO_MS = 60000; // 1min = 60000ms
const beat = 8; // 초기 비트
const musicInfo = [
  { inst: 'drum', file: './sound/1.wav', beat }
  // { inst: 'B', file: './sound/2.wav', beat: 6 },
  // { inst: 'D', file: './sound/3.wav', beat: 4 },
  // { inst: 'C', file: './sound/4.wav', beat: 3 },
  // { inst: 'E', file: './sound/5.wav', beat: 2 }
];

// real data
// Pad 좌표 모두 0으로 초기화(32비트)
// const padArr = Array.from(Array(musicInfo.length), () =>
//   Array(MAX_BEAT).fill(0)
// );

// dummy data
const padArr = [
  [0, 0, 0, 0, 0, 0, 0, 0]
  // [1, 0, 0, 0, 0, 0, 1, 0],
  // [1, 0, 1, 0, 1, 0, 1, 0],
  // [1, 0, 0, 1, 0, 0, 0, 0],
  // [1, 1, 1, 1, 0, 0, 1, 0]
];

let bpm = 150;
let playingColumn = 0;
let timerId = null;

/* ==== functions ==== */

const stopMusic = () => {
  clearInterval(timerId);
  timerId = null;
};
const playMusic = startColumn => {
  const oneBeatTime = Math.floor(MIN_TO_MS / bpm);
  if (!timerId) {
    // $playBtn.textContent = 'stop';
    $playBtn.style['background-image'] = 'url("/assets/img/stop_icon.svg")';
    playingColumn = startColumn;
    timerId = setInterval(() => {
      // 각 악기의 비트 추출
      const beats = musicInfo.map(row => row.beat);

      // 각 악기의 현재 재생 중인 column 정보
      const eachPlayingColumns = beats.map(
        eachBeat => playingColumn % eachBeat
      );

      // 각 재생 중인 column에서의 Pad 값
      const eachStatus = padArr.map((row, i) => row[eachPlayingColumns[i]]);

      // 플레이할 악기 배열
      const instsToPlay = [];
      eachStatus.forEach((v, i) => {
        if (v) instsToPlay.push(musicInfo[i].file);
      });

      // 오디오 객체 생성
      const audios = instsToPlay.map(file => new Audio(file));
      // async
      audios.forEach(audio => {
        audio.play();
      });

      playingColumn += 1;

      // if (playingColumn === beat) clearInterval(timerId);
    }, oneBeatTime);
    return;
  }
  $playBtn.style['background-image'] = 'url("/assets/img/play_icon.svg")';
  stopMusic();
};

/* ==== event handlers ==== */
window.addEventListener('DOMContentLoaded', () => {
  $bpmInput.value = bpm;
});

$playBtn.addEventListener('click', () => {
  // 인터랙션 위해서 임의로 추가(해결 방법 찾는 중)
  const audio = new Audio('./sound/1.wav');
  audio.muted = true;
  audio.play();
  audio.pause();

  // 음악 재생
  playMusic(0);
});

// Pad 클릭 시 active class 토글, pad 값 업데이트(0 | 1)
// $musicPad.addEventListener('click', e => {
//   if (!e.target.matches('.panel')) return;
//   const xLoc = e.target.dataset.row;
//   const yLoc = e.target.dataset.col;
//   e.target.classList.toggle('active', padArr[xLoc][yLoc] === 0);

//   padArr[xLoc][yLoc] = padArr[xLoc][yLoc] === 0 ? 1 : 0;
// });

let isActive = false;

const handleMouseOver = e => {
  console.log('mouseover일어남');
  if (!e.target.matches('label.panel-cell')) return;
  const checkbox = e.target.previousElementSibling;
  const cellId = checkbox.id;
  const splitedCell = cellId.split('-');
  const xLoc = splitedCell[1];
  const yLoc = splitedCell[2];

  // 리팩토링 필요
  if (!isActive) {
    padArr[xLoc][yLoc] = 1;
    checkbox.checked = true;
  } else {
    padArr[xLoc][yLoc] = 0;
    checkbox.checked = false;
  }
};
let startCheckBox;
$musicPad.addEventListener('mousedown', e => {
  console.log('mousedown일어남');

  if (!e.target.matches('label.panel-cell')) return;

  // checkbox check 여부
  const checkbox = e.target.previousElementSibling;
  startCheckBox = e.target.previousElementSibling;
  console.log('checkbox', checkbox);

  isActive = checkbox.checked;

  const cellId = checkbox.id;
  const splitedCell = cellId.split('-');

  const xLoc = splitedCell[1];
  const yLoc = splitedCell[2];

  // 리팩토링 필요
  if (!isActive) {
    padArr[xLoc][yLoc] = 1;
    checkbox.checked = 'checked';
  } else {
    padArr[xLoc][yLoc] = 0;
    checkbox.checked = false;
  }

  $musicPad.addEventListener('mouseover', handleMouseOver);
});

$musicPad.addEventListener('mouseup', e => {
  if (!e.target.matches('label.panel-cell')) return;
  console.log(e.target.previousElementSibling, startCheckBox);
  if (e.target.previousElementSibling === startCheckBox) return;
  console.log('mouseup일어남');

  $musicPad.removeEventListener('mouseover', handleMouseOver);
});
// down up
// beat 변경
document
  .querySelector('.bpm-control')
  .addEventListener('click', ({ target }) => {
    if (!target.matches('button')) return;
    const delta = target.classList.contains('bpm-up-btn') ? 10 : -10;
    bpm += delta;
    $bpmInput.value = bpm;

    // Play 중 일 경우
    if (timerId) {
      stopMusic();
      playMusic(playingColumn);
    }
  });
