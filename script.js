'use strict';

const detailsCheckbox = document.getElementById('details__checkbox');
const btnHeaderClose = document.querySelector('.btn__header__list');
const instructions = document.querySelector('.instructions');
const form = document.querySelector('.form');
const containerEvents = document.querySelector('.events');
const inputEvent = document.querySelector('.form__input--event');
const inputDate = document.querySelector('.form__input--date');
const inputMemory = document.querySelector('.form__input--memory');
const formCloseBtn = document.querySelector('.form__btn--close');
const btnReset = document.querySelector('.btn__reset');

const inputRadioBtns = Array.from(document.querySelectorAll('.radio__btn'));
const formLabelIcons = Array.from(document.querySelectorAll('.form__icon'));

class MemoryEvent {
  id = (Date.now() + '').slice(-10);

  constructor(coords, eventTitle, date, memory, icon) {
    this.coords = coords;
    this.eventTitle = eventTitle;
    this.date = date;
    this.memory = memory;
    this.icon = icon;
    this._setDescription();
    this._formatDetailsDate();
  }
  _setDescription() {
    const options = { day: 'numeric', month: 'long' };
    this.description = `${this.icon} &nbsp; ${this.eventTitle} on ${new Date(
      this.date
    ).toLocaleDateString(undefined, options)}`;
  }

  _formatDetailsDate() {
    const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };

    this.detailsDate = `${new Date(this.date).toLocaleDateString(
      undefined,
      dateOptions
    )} at ${new Date(this.date).toLocaleTimeString([], {
      hour: 'numeric',
      minute: 'numeric',
    })}`;
  }
}

class App {
  #map;
  #mapEvent;
  #memoryEvents = [];

  constructor() {
    this._getPosition();
    this._getLocalStorage();

    this._removeIconClass();
    this._selectIcon();
    this._closeDetailsBox();

    // Event listeners
    form.addEventListener('submit', this._newMemoryEvent.bind(this));
    containerEvents.addEventListener('click', this._moveToPopup.bind(this));
    btnReset.addEventListener('click', this._resetLocalStorage.bind(this));
    formCloseBtn.addEventListener('click', this._hideForm.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your current position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#memoryEvents.forEach(mEvent => this._renderMemoryEventMarker(mEvent));
  }

  _closeDetailsBox() {
    btnHeaderClose.addEventListener('click', function () {
      detailsCheckbox.checked = false;
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputEvent.focus();
    instructions.classList.add('instructions--hide');
  }

  _hideForm() {
    inputEvent.value = inputDate.value = inputMemory.value = '';
    formLabelIcons.forEach(labelIcon =>
      labelIcon.classList.remove('form__icon--selected')
    );
    form.classList.add('hidden');
    instructions.classList.remove('instructions--hide');
  }

  _removeIconClass() {
    formLabelIcons.forEach(icon => {
      icon.addEventListener(
        'click',
        function () {
          formLabelIcons.forEach(labelIcon =>
            labelIcon.classList.remove('form__icon--selected')
          );
        },
        true
      );
    });
  }

  _selectIcon() {
    inputRadioBtns.forEach((button, index) => {
      button.addEventListener(
        'click',
        function () {
          if (button.checked)
            formLabelIcons[index].classList.add('form__icon--selected');
        },
        true
      );
    });
  }

  _newMemoryEvent(e) {
    e.preventDefault();

    const eventTitle = inputEvent.value;
    const eventDate = inputDate.value;
    const memory = inputMemory.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let memEvent;

    inputRadioBtns.forEach((btn, i) => {
      if (btn.checked) {
        const icon = inputRadioBtns[i].value;
        memEvent = new MemoryEvent(
          [lat, lng],
          eventTitle,
          eventDate,
          memory,
          icon
        );
      }
    });

    this.#memoryEvents.push(memEvent);
    this._renderMemoryEventMarker(memEvent);
    this._renderMemoryEvent(memEvent);
    this._hideForm();
    this._setLocaleStorage();
    this._showResetButton();
  }

  _showResetButton() {
    if (!btnReset.classList.contains('btn--opacity')) return;
    btnReset.classList.remove('btn--opacity');
  }

  _renderMemoryEventMarker(memEvent) {
    const myIcon = L.icon({
      iconUrl: 'img/map-pin-fill.svg',
      iconSize: [48, 48],
      popupAnchor: [0, 0],
    });
    L.marker(memEvent.coords, {
      icon: myIcon,
      riseOnHover: true,
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
        })
      )
      .setPopupContent(`${memEvent.description}`)
      .openPopup();
  }

  _renderMemoryEvent(memEvent) {
    const html = `
  <li class='event' data-id="${memEvent.id}">  
    <div class="event__title">
      <span class="event__emoji">${memEvent.icon}</span>
      <span class="event__title__text">${memEvent.eventTitle}</span>
    </div>
    <div class="event__date">${memEvent.detailsDate}</div>
    <details class="event__details">
      <summary class="event__memories--title">My Memories</summary>
      <p class="event__memories--text">
      ${memEvent.memory}
      </p>
    </details>
  </li>
  `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const eventEl = e.target.closest('.event');

    if (!eventEl) return;

    const mEvent = this.#memoryEvents.find(
      memE => memE.id === eventEl.dataset.id
    );

    this.#map.setView(mEvent.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _setLocaleStorage() {
    localStorage.setItem('memEvents', JSON.stringify(this.#memoryEvents));
  }

  _getLocalStorage() {
    let memEvent;
    const data = JSON.parse(localStorage.getItem('memEvents'));

    if (!data) return;

    data.forEach(d => {
      memEvent = new MemoryEvent(
        d.coords,
        d.eventTitle,
        d.date,
        d.memory,
        d.icon
      );

      this.#memoryEvents.push(memEvent);
    });

    this.#memoryEvents.forEach(mEvent => this._renderMemoryEvent(mEvent));

    btnReset.classList.remove('btn--opacity');
  }

  _resetLocalStorage(e) {
    e.preventDefault();
    localStorage.removeItem('memEvents');
    location.reload();
  }
}

const app = new App();
