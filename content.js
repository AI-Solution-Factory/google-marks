const SERVER_URL_ADD_DATA = 'https://observer.pulsear.net/add_data/';
const SERVER_URL_ADD_RADIO_DATA = 'https://observer.pulsear.net/add_checkbox_data/';
const SERVER_URL_GET_CHECKBOX_INFO = 'https://observer.pulsear.net/get_checkbox_info/';

async function sendDataToServer(url, dataArray) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataArray)
        });
        if (!response.ok) {
            throw new Error('Ошибка HTTP: ' + response.status);
        }
    } catch (error) {
        console.error('Ошибка: ' + error);
    }
}

function createRadio(id, image, url, flag) {
    const radioContainer = document.createElement('div');

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = url; 
    radio.id = id;
    radio.dataset.url = url; 
    radio.dataset.flag = flag;

    const labelElement = document.createElement('label');
    labelElement.setAttribute('for', id);

    const imgElement = document.createElement('img');
    imgElement.src = chrome.runtime.getURL('images/' + image);
    imgElement.width = 16;
    imgElement.height = 16;

    labelElement.appendChild(imgElement);
    radioContainer.appendChild(radio);
    radioContainer.appendChild(labelElement);

    return radioContainer;
}

function updateRadioDataArray() {
    radioDataArray = Array.from(document.querySelectorAll('input[type="radio"]')).map(radio => ({
        url: radio.dataset.url,
        flag: radio.checked ? 'true' : 'false',
        id: radio.id
    }));
}

function handleRadioChange(event) {
    const radio = event.target;
    const url = radio.dataset.url;
    const flag = radio.checked ? 'true' : 'false';
    const id = radio.id;
    const data = { url, flag, id };
    sendDataToServer(SERVER_URL_ADD_RADIO_DATA, data);
    updateRadioDataArray(); 
}

function addRadioAndEventListeners(link) {
    const radioCross = createRadio('cross', 'red.png', link.href);
    const radioQuestion = createRadio('question', 'yellow.png', link.href);
    const radioCheck = createRadio('check', 'green.png', link.href);

    const radioContainer = document.createElement('div');
    radioContainer.appendChild(radioCross);
    radioContainer.appendChild(radioQuestion);
    radioContainer.appendChild(radioCheck);
    link.parentNode.insertBefore(radioContainer, link.nextSibling);

    radioCross.querySelector('input[type="radio"]').addEventListener('change', handleRadioChange);
    radioQuestion.querySelector('input[type="radio"]').addEventListener('change', handleRadioChange);
    radioCheck.querySelector('input[type="radio"]').addEventListener('change', handleRadioChange);

    link.classList.add('radio-added');
}

window.addEventListener('scroll', () => {
    const newLinks = Array.from(document.querySelectorAll('div.yuRUbf a[href]:not(.radio-added)'));
    if (newLinks.length > 0) {
        newLinks.forEach(link => {
            addRadioAndEventListeners(link);
        });
        sendDataToServer(SERVER_URL_ADD_DATA, radioDataArray).then(() => sendDataOnPageLoad());
    }
    updateRadioDataArray(); 
});

document.addEventListener('change', function(event) {
    const target = event.target;
    if (target.matches('input[type="radio"]')) {
        const url = target.dataset.url;
        const flag = target.checked ? 'true' : 'false';
        const id = target.id;
        const data = { url, flag, id };
        sendDataToServer(SERVER_URL_ADD_RADIO_DATA, data);
        updateRadioDataArray(); 
    }
});

async function sendDataOnPageLoad() {
    try {
        const links = Array.from(document.querySelectorAll('div.yuRUbf a[href]')).map(link => link.href);
        const requestData = links.map(url => ({
            url,
            flag: "flag_value",
            id: "checkbox_id" 
        }));

        const response = await fetch(SERVER_URL_GET_CHECKBOX_INFO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Ошибка HTTP: ' + response.status);
        }

        const checkboxInfo = await response.json();
        updateRadioCheckboxes(checkboxInfo);
    } catch (error) {
        console.error('Ошибка: ' + error);
    }
}

function updateRadioCheckboxes(checkboxInfoArray) {
    checkboxInfoArray.forEach(info => {
        const url = info[0];
        const id = info[1];
        const flag = info[2];
        document.querySelectorAll(`input[type="radio"][data-url="${url}"][id="${id}"]`).forEach(radio => {
            radio.checked = (flag === 'true');
        });
    });
}

function pollServerForRadioUpdates() {
    setInterval(async () => {
        try {
            await sendDataOnPageLoad();
        } catch (error) {
            console.error('Ошибка при обновлении состояния чекбоксов из базы данных: ' + error);
        }
    }, 3000); 
}

let radioDataArray = [];

sendDataToServer(SERVER_URL_ADD_DATA, radioDataArray)
