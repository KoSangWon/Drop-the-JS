/* ==== DOMs ==== */
const $playBtn = document.querySelector('.play-btn');
const $musicPad = document.querySelector('.music');
const $instAddBtn = document.querySelector('.inst-add');
// 임시
const $bpmInput = document.querySelector('#bpm-input');
const $beatInput = document.querySelector('#beat-input');
$musicPad.style['background-color'] = 'pink';
/* ==== state ==== */
const MAX_BEAT = 32; // 최대 비트
const COLORS = [
  'red',
  'orange',
  'yellow',
  'leafgreen',
  'green',
  'jade',
  'skyblue',
  'blue',
  'plum',
  'purple'
];

const MIN_TO_MS = 60000; // 1min = 60000ms
let beat = 8; // 초기 비트
const musicInfo = [
  { inst: 'drum', file: './sound/1.wav', beat },
  { inst: 'drum', file: './sound/2.wav', beat },
  { inst: 'drum', file: './sound/3.wav', beat },
  { inst: 'drum', file: './sound/4.wav', beat }
  // { inst: 'drum', file: './sound/5.wav', beat }
];

// real data
// Pad 좌표 모두 0으로 초기화(32비트)
// const padArr = Array.from(Array(musicInfo.length), () =>
//   Array(MAX_BEAT).fill(0)
// );

// dummy data
let padArr = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 1, 0],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 0, 0, 0]
  // [1, 1, 1, 1, 0, 0, 1, 0]
];

let bpm = 150;
let playingColumn = 0;
let timerId = null;

/* ==== functions ==== */
const initCellElements = () => {
  $instAddBtn.insertAdjacentHTML(
    'beforebegin',
    padArr
      .map(
        (_, idx) => `
          <li class="inst-item">
            <div class="inst-item icon-${musicInfo[idx].inst} color-${COLORS[idx]}"></div>
            <button class="inst-delete-btn"></button>
          </li>
    `
      )
      .join('')
  );
  $musicPad.innerHTML = padArr
    .map((padRow, rowIdx) =>
      padRow.map(
        (padCell, colIdx) => `
        <div class="panel--${COLORS[rowIdx]}">
          <input type="checkbox" id="cell-${rowIdx}-${colIdx}" ${
          padCell ? 'checked' : ''
        } />
          <label class="panel-cell" for="cell-${rowIdx}-${colIdx}"></label>
        </div>`
      )
    )
    .flat()
    .join('');
};

const stopMusic = () => {
  document.querySelectorAll('.running').forEach($label => {
    $label.classList.remove('running');
  });
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

      document.querySelectorAll('.running').forEach($label => {
        $label.classList.remove('running');
      });

      eachPlayingColumns.forEach((col, row) => {
        document
          .querySelector(`#cell-${row}-${col} + label`)
          .classList.add('running');
      });

      playingColumn += 1;
    }, oneBeatTime);
    return;
  }
  $playBtn.style['background-image'] = 'url("/assets/img/play_icon.svg")';
  stopMusic();
};

// change bpm
const changeBeat = () => {
  padArr = padArr.map(row =>row.length < beat
      ?  [...row, ...Array.from({ length: beat - row.length }, () => 0)]
      : row.slice(0, beat));
    initCellElements()
};

/* ==== event handlers ==== */
window.addEventListener('DOMContentLoaded', () => {
  $bpmInput.value = bpm;
  $beatInput.value = 8;
  initCellElements();
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

let isActive = false;

const handleMouseOver = e => {
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

$musicPad.addEventListener('mousedown', e => {
  if (!e.target.matches('label.panel-cell')) return;

  const checkbox = e.target.previousElementSibling;

  isActive = checkbox.checked;

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

  $musicPad.addEventListener('mouseover', handleMouseOver);
});

$musicPad.addEventListener('mouseup', () => {
  $musicPad.removeEventListener('mouseover', handleMouseOver);
});

$musicPad.addEventListener('mouseleave', () => {
  $musicPad.removeEventListener('mouseover', handleMouseOver);
});

$musicPad.addEventListener('click', e => {
  e.preventDefault();
});

// mobile touch event
$musicPad.addEventListener('touchmove', e => {
  e.preventDefault();
});

// beat 변경
document.querySelector('.beat-control').addEventListener('click', ({target}) => {
  if(!target.matches('button')) return;
  const delta = target.classList.contains('beat-up-btn') ? 1 : -1;
  beat += delta;
  if (beat < 4) beat = 4;
  if (beat > 16) beat = 16;
  $beatInput.value = beat;
  changeBeat();
});

// down up
// bpm 변경
document
  .querySelector('.bpm-control')
  .addEventListener('click', ({ target }) => {
    if (!target.matches('button')) return;
    const delta = target.classList.contains('bpm-up-btn') ? 10 : -10;
    bpm += delta;
    if (bpm < 100) bpm = 100;
    if (bpm > 800) bpm = 800;
    $bpmInput.value = bpm;

    // Play 중 일 경우
    if (timerId) {
      stopMusic();
      playMusic(playingColumn);
    }
  });

// pad 초기화
document.querySelector('.file-clear-btn').addEventListener('click', () => {
  padArr = Array.from(Array(musicInfo.length), () => Array(MAX_BEAT).fill(0));
});

// Beat input 변경
$beatInput.addEventListener('keyup', e => {
  if (e.key === 'Enter') {
    beat = +$beatInput.value;
    if (beat < 4) beat = 4;
    if (beat > 16) beat = 16;
    $beatInput.value = beat;
    $beatInput.blur();
    changeBeat();
  }
});

// BPM input 변경
$bpmInput.addEventListener('keyup', e => {
  if (e.key === 'Enter') {
    bpm = +$bpmInput.value;
    if (bpm < 100) bpm = 100;
    if (bpm > 800) bpm = 800;
    $bpmInput.value = bpm;
    $bpmInput.blur();
    if (timerId) {
      stopMusic();
      playMusic(playingColumn);
    }
  }
});

$beatInput.addEventListener('input', () => {
  $beatInput.value = $beatInput.value
    .replace(/[^0-9]/g, '')
    .replace(/(\..*)\./g, '$1');
});

$bpmInput.addEventListener('input', () => {
  $bpmInput.value = $bpmInput.value
    .replace(/[^0-9]/g, '')
    .replace(/(\..*)\./g, '$1');
});
// keyboard interaction 리팩토링 필요]
document.addEventListener('keyup', event => {
  if (document.activeElement.matches('.body')) return;

  const $activeElem = document.activeElement;
  // get position
  const [, xLoc, yLoc] = $activeElem.id.split('-');
  const [, lastXLoc, lastYLoc] = document
    .querySelector('.music')
    .lastElementChild.firstElementChild.id.split('-');

  // instrument list
  const insts = [...document.querySelector('.inst-list').children];

  if (event.key === 'ArrowRight') {
    // last panel
    if (xLoc === lastXLoc && yLoc === lastYLoc) {
      document.querySelector('.add-btn').focus();
    }
    // panel is end of line
    else if (yLoc === lastYLoc) {
      insts[+xLoc + 1].lastElementChild.focus();
    }
    // add button -> play button
    else if ($activeElem.matches('.inst-item > .add-btn')) {
      document.querySelector('.play-btn').focus();
    }
    // inst -> first panel
    else if ($activeElem.parentElement.matches('.inst-item')) {
      const instInd = insts.indexOf($activeElem.parentElement);
      console.log(instInd);
      document.getElementById(`cell-${instInd}-0`).focus();
    }
    // move panel to right
    else if (yLoc < lastYLoc) {
      document.getElementById(`cell-${xLoc}-${+yLoc + 1}`).focus();
    }
  } else if (event.key === 'ArrowLeft') {
    // if first panel, move to deltet button
    if (yLoc === '0') {
      insts[xLoc].lastElementChild.focus();
    } else if ($activeElem.matches('.add-btn')) {
      document.getElementById(`cell-${lastXLoc}-${lastYLoc}`).focus();
    }
    // if panel is first panel, move to inst
    else if ($activeElem.parentElement.matches('.inst-item')) {
      const instInd = insts.indexOf($activeElem.parentElement);
      if (instInd === 0) return;
      document.getElementById(`cell-${instInd - 1}-${lastYLoc}`).focus();
    }
    // move panel to left
    else if (yLoc > 0) {
      document.getElementById(`cell-${xLoc}-${+yLoc - 1}`).focus();
    }
  } else if (event.key === 'ArrowDown') {
    if ($activeElem.parentElement.matches('.inst-item')) {
      const instInd = insts.indexOf($activeElem.parentElement);
      // inst -> inst
      if (instInd === insts.length - 1) {
        document.querySelector('.play-btn').focus();
      }
      // plus -> play
      else {
        insts[instInd + 1].lastElementChild.focus();
      }
    } else if (xLoc === lastXLoc) {
      document.querySelector('.add-btn').focus();
    } else if ($activeElem.matches('.add-btn')) {
      document.querySelector('.play-btn').focus();
    } else if (xLoc < lastXLoc) {
      document.getElementById(`cell-${+xLoc + 1}-${yLoc}`).focus();
    }
  } else if (event.key === 'ArrowUp') {
    if ($activeElem.parentElement.matches('.inst-item')) {
      const instInd = insts.indexOf($activeElem.parentElement);
      // inst -> inst
      if (instInd !== 0) {
        insts[instInd - 1].lastElementChild.focus();
      }
    } else if ($activeElem.matches('.add-btn')) {
      insts[insts.length - 1].lastElementChild.focus();
    } else if ($activeElem.matches('.play-btn')) {
      document.querySelector('.add-btn').focus();
    } else if (xLoc > 0) {
      document.getElementById(`cell-${+xLoc - 1}-${yLoc}`).focus();
    }
  }
});
