import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLmWrBaRcZZdG2e7bOD7MoqoCRirkVZqI",
  authDomain: "is-bingo.firebaseapp.com",
  projectId: "is-bingo",
  storageBucket: "is-bingo.appspot.com",
  messagingSenderId: "760850828545",
  appId: "1:760850828545:web:fd731405f3891823cd1f00"
};

const range = 50;
const params = new URLSearchParams(location.search);
const branch = params.get('branch');
const key = params.get('key');
const app = initializeApp(firebaseConfig);
const game = doc(getFirestore(app), 'game', branch);

let playername;
let start = 0;
let bingoNumbers = [];
let clickNumbers = [];
let bingoGenerate = [];
let bingoCheck = [];

function generateNumbers() {
  while (true) {
    let numrandom = Math.floor((Math.random() * range) + 1);
    if (bingoGenerate.indexOf(numrandom) < 0) {
      bingoGenerate.push(numrandom);
    }
    if (bingoGenerate.length == 25) {
      bingoGenerate.sort(function (a, b) {
        return a - b;
      });
      break;
    }
  }

  let arr = [];
  let arr2 = [];
  for (let i = 0; i < bingoGenerate.length; i++) {
    if ((i + 1) % 5 == 0) {
      bingoCheck.push(arr);
    }
    if (i % 5 == 0) {
      arr = [];
      arr.push(bingoGenerate[i]);
    }
    else {
      arr.push(bingoGenerate[i]);
    }
  }
  return `${playername}|${bingoGenerate}`;
}

function checkClientBingo() {
  let status = false;
  let countCheck = 0;

  for (let i = 0; i < 5; i++) {
    countCheck = 0;
    for (let j = 0; j < 5; j++) {
      if (i == 2 && j == 2) countCheck++;
      else {
        for (let bingo_check = 0; bingo_check < clickNumbers.length; bingo_check++) {
          if (clickNumbers[bingo_check] == bingoCheck[i][j]) {
            countCheck++;
          }
        }
      }
      if (countCheck == 5) {
        status = true;
      }
    }
  }

  countCheck = 0;
  for (let i = 0; i < 5; i++) {
    countCheck = 0;
    for (let j = 0; j < 5; j++) {
      if (i == 2 && j == 2) countCheck++;
      else {
        for (let bingo_check = 0; bingo_check < clickNumbers.length; bingo_check++) {
          if (clickNumbers[bingo_check] == bingoCheck[j][i]) {
            countCheck++;
          }
          if (countCheck == 5) {
            status = true;
          }
        }
      }
    }
  }

  countCheck = 0;
  for (let i = 0; i < 5; i++) {
    if (i == 2) countCheck++;
    else {
      for (let bingo_check = 0; bingo_check < clickNumbers.length; bingo_check++) {
        if (clickNumbers[bingo_check] == bingoCheck[i][i]) {
          countCheck++;
        }
        if (countCheck == 5) {
          status = true;
        }
      }
    }
  }

  countCheck = 0;
  for (let i = 0; i < 5; i++) {
    if (i == 2) countCheck++;
    else {
      for (let bingo_check = 0; bingo_check < clickNumbers.length; bingo_check++) {
        if (clickNumbers[bingo_check] == bingoCheck[i][4 - i]) {
          countCheck++;
        }
        if (countCheck == 5) {
          status = true;
        }
      }
    }
  }
  return status;
}

async function checkBingo(numberBingo) {
  numberBingo = +numberBingo;
  if (clickNumbers.indexOf(numberBingo) == -1 &&
    bingoNumbers.indexOf(numberBingo) != -1 && start != 2) {
    clickNumbers.push(numberBingo);
    document.getElementById(numberBingo).style.backgroundColor = 'red';
    if (checkClientBingo()) {
      await setDoc(game, {
        'check': `${playername}|${clickNumbers}`
      });
      // db.ref(`${branch}/check`).set(playername + "|" + clickNumbers);
    }
  }
}

onSnapshot(game, async doc => {
  const data = doc.data();
  if (key == data.secret) {
    playername = prompt('Please enter your name', '');
    document.getElementById('status_connect')
      .innerHTML = '<span id="online">Online</span>';
    document.getElementById('player_name').innerHTML = playername;

    bingoPlayer = generateNumbers();
    if (start == 0 && bingoPlayer != '') {
      await setDoc(game, {
        'client': bingoPlayer
      });
      // db.ref(`${branch}/client`).set(bingoPlayer);

      let htmlText = '';
      for (let i = 0; i < bingoGenerate.length; i++) {
        if (i % 5 == 0) {
          htmlText += '<tr>';
        }
        if (i == 12) {
          htmlText += `<td id="${bingoGenerate[i]}"><img src="img/logo.jpg" style="text-align:center;vertical-align:middle;"></td>`;
        }
        else {
          htmlText += `<td id="${bingoGenerate[i]}" onClick="checkBingo('${bingoGenerate[i]}')">${bingoGenerate[i]}</td>`;
        }
        if ((i + 1) % 5 == 0) {
          htmlText += '</tr>';
        }
      }
      document.getElementById('bingo_card').innerHTML = htmlText;
    }
    else {
      window.alert('ขออภัย เกมเริ่มแล้ว กรุณารอรอบถัดไป');
    }
  }
  else {
    document.getElementById('bingo_card').style.display = 'none';
    document.getElementById('checkNumber').style.display = 'none';
    window.alert('เกมรอบนี้สิ้นสุดแล้ว กรุณาสแกน QR เพื่อเข้าเล่นใหม่');
    start = 0;
    return;
  }

  if (playername.trim() != null && playername.trim().length != 0) {
    // db.ref(`${branch}/time`).on('value', function (snapshot) {
      if (start == 0) {
        document.getElementById('checkNumber').innerHTML = `Wait ${data.time} sec.`;
      }
    // });
    // db.ref(`${branch}/start`).on('value', function (snapshot) {
      if (data.start) {
        start = 1;
        document.getElementById('bingo_card').style.display = 'table';
        document.getElementById('checkNumber').innerHTML = '';
      }
    // });
    // db.ref(`${branch}/pop`).on('value', function (snapshot) {
      if (start == 1) {
        bingoNumbers = data.pop;
        let showNumberCheck = '';
        for (let i = 0; i < bingoNumbers.length; i++) {
          if ((i + 1) % 10 === 0) {
            if (i == 0) {
              showNumberCheck += bingoNumbers[i];
            }
            else if (i == (bingoNumbers.length - 1)) {
              showNumberCheck += ` , <span id="numberSize">${bingoNumbers[i]}</span><br>`;
            }
            else {
              showNumberCheck += ` , ${bingoNumbers[i]}<br>`;
            }
          }
          else {
            if (i == 0) {
              showNumberCheck += bingoNumbers[i];
            }
            else if (i == (bingoNumbers.length - 1)) {
              showNumberCheck += ' , <span id="numberSize">' + bingoNumbers[i] + '</span>';
            }
            else {
              showNumberCheck += ' , ' + bingoNumbers[i];
            }
          }
        }
        document.getElementById('checkNumber').innerHTML = showNumberCheck;
      }
    // });
    // db.ref(`${branch}/BINGO`).on('value', function (snapshot) {
      const msg = data.BINGO;
      if (start == 1) {
        if (playername == msg) {
          document.getElementById('win').innerHTML = '<span style="color:green;">You BINGO!!!</span>';
        }
        else {
          document.getElementById('win').innerHTML = `<span style="color:red;">You LOST!!!, ${msg} is winner.</span>`;
        }
        start = 2;
      }
    // });
  }
  else {
    document.getElementById('checkNumber').innerHTML = 'Input name invalid, <a href="javascript:location.reload()">Try again</a>.';
  }
});