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

const branch = new URLSearchParams(location.search).get('branch');
const app = initializeApp(firebaseConfig);
const game = doc(getFirestore(app), 'game', branch);

const wait = 20;
const playerMax = 100;
const timespeed = 5000;
const range = 50;
const secretKey = Math.round(Math.random() * 1e15);

let time = wait;
let start = 0;
let client = [];
let bingoClients = [];
let bingoNumbers = [];
let serverStartCountdown;
let serverStartBingo;

function stopFunction() {
  start = 2;
  clearInterval(serverStartBingo);
}

async function startFunction() {
  if (start == 1 && time == 0 && bingoNumbers.length < range) {
    let numrandom;
    while (true) {
      numrandom = Math.floor((Math.random() * range) + 1);
      if (bingoNumbers.indexOf(numrandom) < 0) {
        responsiveVoice.speak(`${numrandom}`);
        bingoNumbers.push(numrandom);
        break;
      }
    }
    await setDoc(game, {
      'pop': bingoNumbers
    });
    // db.ref(`game/${branch}/pop`).set(bingoNumbers);

    let numberRandom = '';
    for (let i = 0; i < bingoNumbers.length; i++) {
      if (i == (bingoNumbers.length - 1)) {
        document.getElementById('nlast').innerHTML = bingoNumbers[i];
      }
      numberRandom += (bingoNumbers[i] + ((i + 1) % 10 == 0 ? '<br>' : '&nbsp;'));
    }
    document.getElementById('checkNumber').innerHTML = numberRandom;
  }
  if (bingoNumbers.length == range) {
    stopFunction();
  }
}

async function serverStartFunction() {
  if (time > 0) {
    if (client.length > 0) {
      document.getElementById('countdown').innerHTML = `( wait ${time} sec. )`;
      await setDoc(game, {
        'time': time--
      });
      // db.ref(`${branch}/time`).set(time);
      // time--;
    }
  }
  else {
    start = 1;
    clearInterval(serverStartCountdown);
    serverStartBingo = setInterval(startFunction, timespeed);
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('countdown').innerHTML = '';
    await setDoc(game, {
      'start': true
    });
    // db.ref(`${branch}/start`).set(true);
  }
}

function checkClient(id, msgStr) {
  let index_client = client.indexOf(id);
  if (index_client != -1) {
    let msgs = msgStr.split(',');
    let arrCheck = bingoClients[index_client];
    let countCheck = 0;

    for (let i = 0; i < 5; i++) {
      countCheck = 0;
      for (let j = 0; j < 5; j++) {
        if (i == 2 && j == 2) countCheck++;
        else {
          for (let bingo_check = 0; bingo_check < msgs.length; bingo_check++) {
            if (parseInt(msgs[bingo_check]) == parseInt(arrCheck[i][j])) {
              countCheck++;
            }
          }
          if (countCheck == 5) {
            return true;
          }
        }
      }
    }

    for (let i = 0; i < 5; i++) {
      countCheck = 0;
      for (let j = 0; j < 5; j++) {
        if (i == 2 && j == 2) countCheck++;
        else {
          for (let bingo_check = 0; bingo_check < msgs.length; bingo_check++) {
            if (parseInt(msgs[bingo_check]) == parseInt(arrCheck[j][i])) {
              countCheck++;
            }
            if (countCheck == 5) {
              return true;
            }
          }
        }
      }
    }

    countCheck = 0;
    for (let i = 0; i < 5; i++) {
      if (i == 2) countCheck++;
      else {
        for (let bingo_check = 0; bingo_check < msgs.length; bingo_check++) {
          if (parseInt(msgs[bingo_check]) == parseInt(arrCheck[i][i])) {
            countCheck++;
          }
          if (countCheck == 5) {
            return true;
          }
        }
      }
    }

    countCheck = 0;
    for (let i = 0; i < 5; i++) {
      if (i == 2) countCheck++;
      else {
        for (let bingo_check = 0; bingo_check < msgs.length; bingo_check++) {
          if (parseInt(msgs[bingo_check]) == parseInt(arrCheck[i][4 - i])) {
            countCheck++;
          }
          if (countCheck == 5) {
            return true;
          }
        }
      }
    }
  }
}

await setDoc(game, {
  'secret': secretKey,
  'client': '|',
  'check': '|',
  'start': false,
  'BINGO': '',
  'pop': '',
  'time': time
});
new QRious({
  element: document.getElementById('qrcode-img'),
  value: `https://ajkaew.github.io/bingo/client.html?branch=${branch}&key=${secretKey}`,
  size: 400
});

document.getElementById('status_connect')
  .innerHTML = '<span id="online">Online</span>';
if (start == 0) {
  document.getElementById('qrcode').style.display = 'block';
}

onSnapshot(game, async doc => {
  const data = doc.data();
  let msg = data.client.split('|');
  if (start == 0) {
    if (msg[0] != '' && client.indexOf(msg[0]) < 0) {
      clearInterval(serverStartCountdown);
      time = wait;
      serverStartFunction();
      serverStartCountdown = setInterval(serverStartFunction, 1000);
      client.push(msg[0]);
      document.getElementById('displays').style.display = 'block';
      document.getElementById('nplayer')
        .innerHTML = `${client.length} Player` + (client.length > 1 ? 's' : '');

      let arr_client = msg[1].split(',');
      let arr = [];
      let bingoClient = [];
      for (let i = 0; i < arr_client.length; i++) {
        if ((i + 1) % 5 == 0) {
          bingoClient.push(arr);
        }
        if (i % 5 == 0) {
          arr = [];
          arr.push(arr_client[i]);
        }
        else {
          arr.push(arr_client[i]);
        }
      }
      bingoClients.push(bingoClient);
      if (client.length >= playerMax) {
        time = 0;
        await serverStartFunction();
      }
    }
  }
  msg = data.check.split('|');
  if (start == 1) {
    if (checkClient(msg[0], msg[1])) {
      responsiveVoice.speak('บิงโก้', 'Thai Female');
      await setDoc(game, {
        'BINGO': msg[0]
      });
      // db.ref(`${branch}/BINGO`).set(msg[0]);
      document.getElementById('nlast').innerHTML = msg[0];
      stopFunction();
    }
  }
});