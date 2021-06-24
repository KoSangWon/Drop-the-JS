/* ==== DOMs ==== */
const $overlay = document.querySelector('.overlay');
const $playBtn = document.querySelector('.play-btn');
const $musicPad = document.querySelector('.music');
const $musicPadMask = document.querySelector('.music-mask');
const $controls = document.querySelector('.controls');

const $pageUpBtn = document.querySelector('.page-up-btn');
const $pageDownBtn = document.querySelector('.page-down-btn');
const $currentPage = document.querySelector('.current-page');
const $totalPage = document.querySelector('.total-page');

const $fileUploadBtn = document.querySelector('input[type="file"]');
const $fileDownloadBtn = document.querySelector('.file-save-btn');

const $instList = document.querySelector('.inst-list');
const $bpmInput = document.querySelector('#bpm-input');
const $beatInput = document.querySelector('#beat-input');

const $menuToggleBtn = document.querySelector('.menu-toggle-btn');

/* ==== state ==== */
const VIEW_PAGE = matchMedia('screen and (max-width: 767px)').matches ? 8 : 16;
const MIN_BEAT = 4; // 최소 비트
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

const instSet = [
  { instName: 'drum', file: './sound/1.wav', used: true },
  { instName: 'side-stick', file: './sound/2.wav', used: true },
  { instName: 'cymbal', file: './sound/3.wav', used: true },
  { instName: 'opened-hihat', file: './sound/4.wav', used: true },
  { instName: 'clap', file: './sound/5.wav', used: true },
  { instName: 'closed-hihat', file: './sound/6.wav', used: false },
  { instName: 'ride', file: './sound/7.wav', used: false },
  { instName: 'kick', file: './sound/8.wav', used: false },
  { instName: 'hightom', file: './sound/9.wav', used: false },
  { instName: 'lowtom', file: './sound/10.wav', used: false }
];

const MIN_TO_MS = 60000; // 1min = 60000ms
let beat = 16; // 초기 비트
let musicInfo = [
  { inst: 'drum', file: './sound/1.wav', beat },
  { inst: 'side-stick', file: './sound/2.wav', beat },
  { inst: 'cymbal', file: './sound/3.wav', beat },
  { inst: 'opened-hihat', file: './sound/4.wav', beat },
  { inst: 'clap', file: './sound/5.wav', beat }
];

// data
// Pad 좌표 모두 0으로 초기화(32비트)
let padArr = Array.from(Array(musicInfo.length), () => Array(beat).fill(0));

let currentPage = 1;

let bpm = 150;
let playingColumn = 0;
let timerId = null;

/* ==== functions ==== */

const initAddInstList = () => {
  const $div = document.createElement('div');
  $div.className = 'add-inst-menu';
  const $ul = document.createElement('ul');
  $ul.className = 'add-inst-list';
  $ul.innerHTML = instSet
    .map(
      inst => `<li class="add-inst-item">
          <input type="checkbox" id="inst-item-${inst.instName}" ${
        inst.used ? 'checked' : ''
      }/>
          <label for="inst-item-${inst.instName}">
            <span class="add-icon icon-${inst.instName}"></span>
            <span class="add-inst-name">${inst.instName
              .replace('-', ' ')
              .toUpperCase()}</span>
          </label>
        </li>`
    )
    .join('');
  $div.appendChild($ul);
  document.body.appendChild($div);
};

const initCellElements = () => {
  $musicPad.style.setProperty('--cell-col', beat);
  $totalPage.textContent = '/' + Math.ceil(beat / VIEW_PAGE);
  $currentPage.textContent = currentPage;
  $instList.innerHTML =
    padArr
      .map(
        (_, idx) => `
    <li class="inst-item">
      <div class="icon-${musicInfo[idx].inst} color-${COLORS[idx]}"></div>
    </li>`
      )
      .join('') +
    `<li class="inst-item inst-add">
  <button class="add-btn"></button>
</li>`;
  $musicPad.innerHTML = padArr
    .map((padRow, rowIdx) =>
      padRow.map(
        (padCell, colIdx) => `
        <div class="panel--${COLORS[rowIdx]} ${
          (colIdx + 1) % 4 === 0 ? 'beat-gap' : ''
        }">
          <input type="checkbox" id="cell-${rowIdx}-${colIdx}" ${
          padCell ? 'checked' : ''
        } />
          <label class="panel-cell" for="cell-${rowIdx}-${colIdx}"></label>
        </div>`
      )
    )
    .flat()
    .join('');

  const $instAddBtn = $instList.querySelector('.add-btn');

  // 메뉴 토글이벤트
  $instAddBtn.addEventListener('click', () => {
    const $instMenu = document.querySelector('.add-inst-menu');
    const ToggleInstrument = ({ target: instCheckBox }) => {
      // 바뀐 체크박스의 인덱스 찾기
      let changeIndex = -1;
      const targetName = instCheckBox.id.replace('inst-item-', '');
      instSet.forEach((inst, index) => {
        if (inst.instName === targetName) {
          changeIndex = index;
          inst.used = !inst.used;
        }
      });
      // 악기 추가 시
      if (instCheckBox.checked) {
        let insertIndex = padArr.length;
        // for문으로 해야함
        for (let i = 0; i < musicInfo.length; i++) {
          const music = musicInfo[i];
          const order = instSet.findIndex(inst => inst.instName === music.inst);
          if (changeIndex < order) {
            insertIndex = i;
            break;
          }
        }
        musicInfo = [
          ...musicInfo.slice(0, insertIndex),
          { inst: targetName, file: `./sound/${insertIndex + 1}.wav`, beat },
          ...musicInfo.slice(insertIndex)
        ];
        padArr = [
          ...padArr.slice(0, insertIndex),
          Array.from({ length: beat }, () => 0),
          ...padArr.slice(insertIndex)
        ];
      }
      // 악기 제거 시
      else {
        const deleteIndex = musicInfo.findIndex(
          ({ inst }) => 'inst-item-' + inst === instCheckBox.id
        );
        musicInfo = [
          ...musicInfo.slice(0, deleteIndex),
          ...musicInfo.slice(deleteIndex + 1)
        ];
        padArr = [
          ...padArr.slice(0, deleteIndex),
          ...padArr.slice(deleteIndex + 1)
        ];
      }
      initCellElements();
    };
    if ($instMenu.classList.contains('active')) return;
    $instMenu.classList.add('active');
    $overlay.classList.add('active');
    document.addEventListener('mouseup', function closeMenuHandler(e) {
      if (e.target.closest('.add-inst-menu')) return;
      $instMenu.classList.remove('active');
      $overlay.classList.remove('active');
      document.removeEventListener('mouseup', closeMenuHandler);
      $instMenu.removeEventListener('change', ToggleInstrument);
    });
    initAddInstList();
    $instMenu.addEventListener('change', ToggleInstrument);
  });
};

const movePage = page => {
  currentPage = page;
  $currentPage.textContent = currentPage;
  $musicPad.style.setProperty('--page-offset', currentPage - 1);
};

let canvas;
let ctx;
let source;

let analyser;
let fbcArray;
let barCount;
let barPos;
let barWidth;
let barHeight;

const frameLooper = () => {
  window.RequestAnimationFrame =
    window.requestAnimationFrame(frameLooper) ||
    window.msRequestAnimationFrame(frameLooper) ||
    window.mozRequestAnimationFrame(frameLooper) ||
    window.webkitRequestAnimationFrame(frameLooper);

  fbcArray = new Uint8Array(analyser.frequencyBinCount);
  barCount = window.innerWidth / 2;

  analyser.getByteFrequencyData(fbcArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';

  for (let i = 0; i < barCount; i++) {
    barPos = i * 4;
    barWidth = 2;
    barHeight = -(fbcArray[i] / 2);

    ctx.fillRect(barPos, canvas.height, barWidth, barHeight);
  }
};

const stopMusic = () => {
  document.querySelectorAll('.running').forEach($label => {
    $label.classList.remove('running');
  });
  clearInterval(timerId);
  timerId = null;
};

canvas = document.getElementById('canvas');
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.6;
window.AudioContext = window.AudioContext || window.webkitAudioContext;

const playMusic = startColumn => {
  const context = new AudioContext();
  analyser = context.createAnalyser();
  const oneBeatTime = Math.floor(MIN_TO_MS / bpm);
  if (!timerId) {
    // $playBtn.textContent = 'stop';
    $playBtn.classList.add('playing');
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

      const instsToPlay = [];

      eachStatus.forEach((v, i) => {
        if (v) instsToPlay.push(musicInfo[i].file);
      });

      // 오디오 객체 생성
      const audios = instsToPlay.map(file => new Audio(file));

      audios.forEach(audio => {
        audio.play();
        ctx = canvas.getContext('2d');
        source = context.createMediaElementSource(audio);

        source.connect(analyser);

        analyser.connect(context.destination);
        frameLooper();
      });

      document.querySelectorAll('.running').forEach($label => {
        $label.classList.remove('running');
      });

      eachPlayingColumns.forEach((col, row) => {
        document
          .querySelector(`#cell-${row}-${col} + label`)
          .classList.add('running');
      });
      const willMovePage = Math.ceil(((playingColumn % beat) + 1) / VIEW_PAGE);
      if (currentPage !== willMovePage) {
        movePage(willMovePage);
      }
      playingColumn += 1;
    }, oneBeatTime);
    return;
  }
  $playBtn.classList.remove('playing');
  stopMusic();
};

// change bpm
const changeBeat = () => {
  musicInfo = musicInfo.map(inst => {
    if (inst.beat === padArr[0].length) return { ...inst, beat };
    return { ...inst };
  });
  padArr = padArr.map(row =>
    row.length < beat
      ? [...row, ...Array.from({ length: beat - row.length }, () => 0)]
      : row.slice(0, beat)
  );
  initCellElements();
};

/* ==== event handlers ==== */
window.addEventListener('DOMContentLoaded', () => {
  $bpmInput.value = bpm;
  $beatInput.value = beat;
  initCellElements();
  initAddInstList();
});

// 페이지 이동
$pageUpBtn.addEventListener('click', () => {
  if (currentPage >= Math.ceil(beat / VIEW_PAGE)) return;
  movePage(currentPage + 1);
});

$pageDownBtn.addEventListener('click', () => {
  if (currentPage <= 1) return;
  movePage(currentPage - 1);
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

$musicPadMask.addEventListener('mousedown', e => {
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

  $musicPadMask.addEventListener('mouseover', handleMouseOver);
});

$musicPadMask.addEventListener('mouseup', ({ target }) => {
  $musicPadMask.removeEventListener('mouseover', handleMouseOver);
  if (target.htmlFor) {
    document.getElementById(target.htmlFor).focus();
  }
});

$musicPadMask.addEventListener('mouseleave', () => {
  $musicPadMask.removeEventListener('mouseover', handleMouseOver);
});

$musicPadMask.addEventListener('click', e => {
  e.preventDefault();
});

// mobile touch event

const handleTouchMove = e => {
  const { clientX, clientY } = e.touches[0];

  if (!clientX || !clientY) return;

  const $touchElem = document.elementFromPoint(clientX, clientY);
  if (!$touchElem.matches('label.panel-cell')) return;

  const checkbox = $touchElem.previousElementSibling;

  const cellId = checkbox.id;
  const splitedCell = cellId.split('-');

  const xLoc = splitedCell[1];
  const yLoc = splitedCell[2];

  if (!isActive) {
    padArr[xLoc][yLoc] = 1;
    checkbox.checked = true;
  } else {
    padArr[xLoc][yLoc] = 0;
    checkbox.checked = false;
  }
};

$musicPad.addEventListener('touchstart', e => {
  e.preventDefault();
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

  $musicPad.addEventListener('touchmove', handleTouchMove);
});

$musicPad.removeEventListener('touchend', handleTouchMove);

// beat 변경
document
  .querySelector('.beat-control')
  .addEventListener('click', ({ target }) => {
    if (!target.matches('button')) return;
    const delta = target.classList.contains('beat-up-btn') ? 1 : -1;
    beat += delta;
    if (beat < MIN_BEAT) beat = MIN_BEAT;
    if (beat > MAX_BEAT) beat = MAX_BEAT;
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
  padArr = padArr.map(row => row.fill(0));
  initCellElements();
});

// Beat input 변경
const setBeatInputValue = val => {
  beat = val;
  if (beat < MIN_BEAT) beat = MIN_BEAT;
  if (beat > MAX_BEAT) beat = MAX_BEAT;
  $beatInput.value = beat;
  $beatInput.blur();
  changeBeat();
};

$beatInput.addEventListener('keyup', e => {
  if (e.key === 'Enter') {
    setBeatInputValue(+$beatInput.value);
  }
});

$beatInput.addEventListener('focusout', () => {
  setBeatInputValue(+$beatInput.value);
});

const setBpmInputValue = val => {
  bpm = val;
  if (bpm < 100) bpm = 100;
  if (bpm > 800) bpm = 800;
  $bpmInput.value = bpm;
  $bpmInput.blur();
  if (timerId) {
    stopMusic();
    playMusic(playingColumn);
  }
};

// BPM input 변경
$bpmInput.addEventListener('keyup', e => {
  if (e.key === 'Enter') {
    setBpmInputValue(+$bpmInput.value);
  }
});

$bpmInput.addEventListener('focusout', () => {
  setBpmInputValue(+$bpmInput.value);
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

// file upload
$fileUploadBtn.addEventListener('change', () => {
  const selectedFile = $fileUploadBtn.files[0];

  const reader = new FileReader();
  if (reader) {
    reader.readAsText(selectedFile, 'UTF-8');

    reader.onload = e => {
      let fileData = e.target.result;
      fileData = JSON.parse(fileData);
      // console.log('업로드한 데이터', fileData);
      musicInfo = fileData.musicInfo;
      padArr = fileData.padArr;
      bpm = fileData.bpm;
      beat = fileData.beat;
      initCellElements();
      $beatInput.value = beat;
      $bpmInput.value = bpm;
    };
  }
});

// file download
$fileDownloadBtn.addEventListener('click', () => {
  const infoToSave = {
    musicInfo,
    padArr,
    bpm,
    beat
  };
  const jsonString = JSON.stringify(infoToSave);
  const link = document.createElement('a');
  link.download = `dropthejs-${Date.now()}.djs`;
  const blob = new Blob([jsonString], { type: 'text/plain' });
  link.href = window.URL.createObjectURL(blob);
  link.click();
});

$menuToggleBtn.addEventListener('click', () => {
  $controls.classList.toggle('active');
});

// keyboard interaction 리팩토링 필요]
document.addEventListener('keyup', event => {
  if (event.key === 'Escape') {
    const $instMenu = document.querySelector('.add-inst-menu');
    $instMenu?.classList.remove('active');
    $overlay?.classList.remove('active');
  }
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
      document.getElementById(`cell-${+xLoc+1}-0`).focus();
      movePage(1);
    }
    // add button -> play button
    else if ($activeElem.matches('.inst-item > .add-btn')) {
      document.querySelector('.play-btn').focus();
    }
    // inst -> first panel
    else if ($activeElem.parentElement.matches('.inst-item')) {
      const instInd = insts.indexOf($activeElem.parentElement);

      document.getElementById(`cell-${instInd}-0`).focus();
    }
    // move panel to right
    else if (+yLoc < +lastYLoc) {
      document.getElementById(`cell-${xLoc}-${+yLoc + 1}`).focus();
      $musicPadMask.scrollLeft = 0;
      if (+yLoc === VIEW_PAGE - 1) {
        movePage(2);
      }
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
    else if (+yLoc > 0) {
      document.getElementById(`cell-${xLoc}-${+yLoc - 1}`).focus();
      if (+yLoc === VIEW_PAGE) {
        movePage(1);
      }
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
    } else if (+xLoc < +lastXLoc) {
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
    } else if (+xLoc > 0) {
      document.getElementById(`cell-${+xLoc - 1}-${yLoc}`).focus();
    }
  } else if (event.key === ' ') {
    if (xLoc) {
      const $cell = document.getElementById(`cell-${xLoc}-${yLoc}`);
      $cell.checked = !$cell.checked;
      padArr[xLoc][yLoc] = $cell.checked ? 1 : 0;
    }
  }
});

document.addEventListener('keydown', e => {
  const [, xLoc, yLoc] = document.activeElement.id.split('-');
  const [, lastXLoc, lastYLoc] = document
    .querySelector('.music')
    .lastElementChild.firstElementChild.id.split('-');
  if (e.shiftKey && e.key === 'Tab') {
    if(+yLoc === 0 && +xLoc !== 0){
      e.preventDefault();
      document.getElementById(`cell-${xLoc-1}-${beat-1}`).focus();
      $musicPadMask.scrollLeft = 0;
      currentPage = beat % VIEW_PAGE === 0 ? beat / VIEW_PAGE : Math.floor(beat / VIEW_PAGE)+1;
      movePage(currentPage);
    }
    else if ((+yLoc + 1) % (VIEW_PAGE+1) === 0) {
      currentPage -= 1;
      movePage(currentPage);
    }
    else if(document.activeElement.matches('.play-btn')){
      e.preventDefault();
      document.getElementById(`cell-${lastXLoc}-${lastYLoc}`).focus();
      $musicPadMask.scrollLeft = 0;
      currentPage = beat % VIEW_PAGE === 0 ? beat / VIEW_PAGE : Math.floor(beat / VIEW_PAGE)+1;
      movePage(currentPage);
    }
  } else if (+yLoc + 1 === beat && e.key ==='Tab') {
    if(+xLoc === musicInfo.length-1) return;
    currentPage = 1;
    movePage(currentPage);
  } else if (e.key === 'Tab' && (+yLoc + 1) % VIEW_PAGE === 0) {
    if (+yLoc === 0) return;
    e.preventDefault();
    document.getElementById(`cell-${xLoc}-${+yLoc + 1}`).focus();
    $musicPadMask.scrollLeft = 0;
    currentPage += 1;
    movePage(currentPage);
  }
});
