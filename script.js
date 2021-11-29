'use strict';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const detailsCheckbox = document.getElementById('details__checkbox');
const btnHeaderClose = document.querySelector('.btn__header__list');
const instructions = document.querySelector('.instructions');
const form = document.querySelector('.form');
const containerEvents = document.querySelector('.events');
const inputEvent = document.querySelector('.form__input--event');
const inputDate = document.querySelector('.form__input--date');
const inputMemory = document.querySelector('.form__input--memory');

const btnDeleteEvent = Array.from(
  document.querySelectorAll('.btn__event__close')
);
const inputRadioBtns = Array.from(document.querySelectorAll('.radio__btn'));
const formLabelIcons = Array.from(document.querySelectorAll('.form__icon'));

console.dir(btnDeleteEvent);

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
    this.description = `${this.eventTitle} on ${new Date(
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
    // this._removeFromLocalStorage();

    // Event listeners
    form.addEventListener('submit', this._newMemoryEvent.bind(this));
    containerEvents.addEventListener('click', this._moveToPopup.bind(this));
    // btnDeleteEvent.forEach(btn => {
    //   btn.addEventListener('click', this._removeFromLocalStorage.bind(this));
    // });
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
    console.log(`https://www.google.com/maps/@${latitude},${longitude},15z`);

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

    const validateRadioBtns = radioBtns => {
      for (let i = 0; i < radioBtns.length; i++) {
        if (radioBtns[i].checked) return true;
      }
      return false;
    };

    const eventTitle = inputEvent.value;
    const eventDate = inputDate.value;
    const memory = inputMemory.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let memEvent;

    // if (validateRadioBtns(document.forms['eventForm']['radioIcon']) === false)
    //   return alert('false');

    if (validateRadioBtns(document.forms['eventForm']['radioIcon']) === true) {
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
    }

    console.log(memEvent);

    this.#memoryEvents.push(memEvent);
    this._renderMemoryEventMarker(memEvent);
    this._renderMemoryEvent(memEvent);
    this._hideForm();
    this._setLocaleStorage();
  }

  _renderMemoryEventMarker(memEvent) {
    const myIcon = L.divIcon({
      html: `<i class="${memEvent.icon}"></i>`,
      iconSize: [28, 28],
      popupAnchor: [0, 0],
      className: 'my-div-icon',
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
      .setPopupContent(`🎉 ${memEvent.description}`)
      .openPopup();
  }

  _renderMemoryEvent(memEvent) {
    let html = `
  <li class='event' data-id="${memEvent.id}">
    <button class="btn btn__event__close btn--close">
      <i class="ph-x-circle event__icon--close"></i>
    </button>  
    <div class="event__title">
      <i class="${memEvent.icon} event__icon"></i>${memEvent.eventTitle}
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
    const data = JSON.parse(localStorage.getItem('memEvents'));
    if (!data) return;

    this.#memoryEvents = data;

    this.#memoryEvents.forEach(mEvent => this._renderMemoryEvent(mEvent));
  }

  // _removeFromLocalStorage(e) {
  //   console.log(this.#memoryEvents);
  //   console.log(btnDeleteEvent);
  //   const eventElement = e.target.closest('.event');
  //   console.log(eventElement);

  //   const memoEvent = this.#memoryEvents.find(
  //     memE => memE.id === eventElement.dataset.id
  //   );
  //   console.log(memoEvent);
  // }

  reset() {
    localStorage.removeItem('memEvents');
    location.reload();
  }
}

const app = new App();
