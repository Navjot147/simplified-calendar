
const App = (function () {
  // helpers to create common method for all modules.
  const helpers = (function () {
    function _createDOMElement(type, appendNode, attr) {
      let node = document.createElement(type);
      node = Object.assign(node, attr);
      appendNode.appendChild(node);
      return node;
    }

    function _getNextMonth(currentDate) {
      if (currentDate.getMonth() == 11) {
        return new Date(currentDate.getFullYear() + 1, 0, 1);
      } else {
        return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
    }

    function _getPreviousMonth(currentDate) {
      return new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    }

    function _getDaysInThisMonth(month, year) {
      return new Date(year, month, 0).getDate();
    }

    function _getFirstDay(month, year) {
      return new Date(year, month, 1).getDay();
    }

    function _getLastDay(month, year) {
      return new Date(year, month + 1, 1).getDay();
    }

    function _isCalendarDateEqual(date1, date2) {
      return `${date1.getMonth()}${date1.getFullYear()}}` === `${date2.getMonth()}${date2.getFullYear()}}`;
    }

    return {
      createDOMElement: _createDOMElement,
      getNextMonth: _getNextMonth,
      getDaysInThisMonth: _getDaysInThisMonth,
      getFirstDay: _getFirstDay,
      getLastDay: _getLastDay,
      getPreviousMonth: _getPreviousMonth,
      isCalendarDateEqual: _isCalendarDateEqual
    }
  })();

  // config module used to update the static variables
  const globalStateModule = (function (helpers) {
    const { getNextMonth } = helpers;
    const _days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const _monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const _startDate = new Date();
    let _dateArr = [_startDate, getNextMonth(_startDate)];

    function _setDateArr(newArr) {
      _dateArr = newArr;
    }

    function _getDateArr() {
      return _dateArr;
    }

    return {
      days: _days,
      monthNames: _monthNames,
      currentDate: _startDate,
      dateArr: _dateArr,
      setDateArr: _setDateArr,
      getDateArr: _getDateArr
    }
  })(helpers);

  // this module responsible to handle the popup event and actions
  const popUpModule = (function (helpers) {

    function _initEvent() {
      document.getElementById("saveEvent").addEventListener("click", _saveEvent);
      document.getElementById("cancelEvent").addEventListener("click", _hideAddEventPopUp);
      document.getElementById("imgCloseIcon").addEventListener("click", _hideAddEventPopUp);
    }

    function _checkFormValid(values) {
      const { startTime, endTime, date, name } = values;
      const isStartDateValid = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]) ([AP]M|[ap]m)$/g.test(startTime);
      const isEndDateValid = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]) ([AP]M|[ap]m)$/g.test(endTime);
      if (!name) {
        return `Name of the Event Can't be Empty`;
      }
      if (!endTime) {
        return `End time of the Event Can't be Empty`;
      }
      if (!startTime) {
        return `Start time of the Event Can't be Empty`;
      }
      if (!/[A-Za-z0-9]+$/g.test(name)) {
        return 'Invalid Name';
      }
      if (!isStartDateValid) {
        return 'Invalid Start Time';
      }
      if (!isEndDateValid) {
        return 'Invalid End Time';
      }
      if (!Date.parse(date)) {
        return 'Invalid Event Date';
      }
    }

    function _hideAddEventPopUp() {
      document.getElementById("popup").style.display = "none";
      document.getElementById("genericError").innerHTML = "";
      document.getElementById("txtNameEvent").value = '';
      document.getElementById("currentDate").value = '';
      document.getElementById("txtStartTime").value = '';
      document.getElementById("txtEndTime").value = '';
    }

    function _addEventToDateCell(eventDate, attr) {
      const selectedCell = document.getElementById(`${eventDate.getFullYear()}${eventDate.getMonth()}${eventDate.getDate()}events`);
      helpers.createDOMElement('span', selectedCell, { className: 'event', innerHTML: `<label>${attr.name}</label><span>${attr.startTime.trim()}-${attr.endTime.trim()}</span>` });
    }

    function _saveEvent() {
      const eventObj = JSON.parse(localStorage.getItem("eventObj")) || {};
      const { value: name } = document.getElementById("txtNameEvent");
      const { value: date } = document.getElementById("currentDate");
      const { value: startTime } = document.getElementById("txtStartTime");
      const { value: endTime } = document.getElementById("txtEndTime");
      const eventDate = new Date(date);
      const errorMessage = _checkFormValid({ date: eventDate, startTime, endTime, name });
      if (errorMessage) {
        document.getElementById('genericError').innerHTML = errorMessage;
        setTimeout(() => {
          document.getElementById("genericError").innerHTML = "";
        }, 3000);
        return;
      }
      const key = `${eventDate.getFullYear()}${eventDate.getMonth()}${eventDate.getDate()}`;
      if (eventObj[key]) {
        eventObj[key].push({ name, startTime, endTime });
      } else {
        eventObj[key] = [{ name, startTime, endTime }];
      }
      _addEventToDateCell(eventDate, { name, startTime, endTime })
      localStorage.setItem("eventObj", JSON.stringify(eventObj));
      _hideAddEventPopUp();
    }

    return {
      initEvents: _initEvent
    }
  })(helpers);

  // this module responsible to make the calendar
  const calendarModule = (function (helpers, globalStateModule) {

    const { days, monthNames, currentDate, setDateArr, getDateArr } = globalStateModule;
    const { getDaysInThisMonth, getFirstDay, getNextMonth, createDOMElement, getLastDay, getPreviousMonth, isCalendarDateEqual } = helpers;

    let position = $(window).scrollTop();

    function _onScrollHandler(eventObj) {
      let scroll = $(window).scrollTop();
      if (scroll > position) {
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 300) {
          const nextMonth = getNextMonth(new Date(getDateArr()[getDateArr().length - 1]));
          _createMonthContainer(nextMonth.getMonth(), nextMonth.getFullYear(), eventObj);
          setDateArr(getDateArr().concat([nextMonth]));
          if (getDateArr().length > 10) {
            const calendarContainer = document.getElementById("calendar");
            calendarContainer.removeChild(calendarContainer.childNodes[0]);
            setDateArr(getDateArr().slice(1));
          }
        }
      } else {
        if ((scroll - $('.month-container').first().height()) < 0) {
          if (!isCalendarDateEqual(currentDate, getDateArr()[0])) {
            const previousMonth = getPreviousMonth(getDateArr()[0]);
            _createMonthContainer(previousMonth.getMonth(), previousMonth.getFullYear(), eventObj, true);
            setDateArr([previousMonth].concat(getDateArr().slice(0, getDateArr().length - 1)));
            const calendarContainer = document.getElementById("calendar");
            calendarContainer.removeChild(calendarContainer.childNodes[calendarContainer.childNodes.length - 1]);
          }
        }
      }
      position = scroll;
    }

    function _showAddEventPopUp(month, year, day) {
      document.getElementById("currentDate").value = new Date(year, month, day).toDateString();
      document.getElementById("popup").style.display = "block";
    }

    function _createHeader(month, year, node) {
      createDOMElement("div", node, {
        className: "header",
        innerHTML: `<span class="info">${monthNames[month]}  ${year}</span>`
      });
    }

    function _createDayName(node) {
      const daysNode = createDOMElement("div", node, {
        className: "day-name"
      });
      for (let i = 0; i < days.length; i++) {
        createDOMElement("span", daysNode, {
          innerHTML: `${days[i]}`
        });
      }
    }

    function _createDaysOfMonth(month, year, eventObj, node) {
      const numberOfDays = getDaysInThisMonth(month + 1, year);
      const firstDay = getFirstDay(month, year);
      const daysContainer = createDOMElement("div", node, { className: "days-container" });
      for (let i = 0; i < firstDay; i++) {
        createDOMElement("span", daysContainer, {
          className: "day-cell",
          innerHTML: `<span></span>`
        });
      }
      for (let i = 1; i <= numberOfDays; i++) {
        const cell = createDOMElement("span", daysContainer, {
          className: `day-cell`,
          innerHTML: `<span class="date-text">${i}</span>`
        });
        const eventsContainer = createDOMElement("div", cell, { className: "events", id: `${year}${month}${i}events`, });

        if (eventObj[`${year}${month}${i}`]) {
          const events = eventObj[`${year}${month}${i}`];
          for (let j = 0; j < events.length; j++) {
            createDOMElement('span', eventsContainer, { className: 'event', innerHTML: `<label>${events[j].name}</label><span>${events[j].startTime.trim()}-${events[j].endTime.trim()}</span>` });
          }
        }
        cell.addEventListener("click", _showAddEventPopUp.bind(null, month, year, i));
      }

      if (getLastDay(month, year)) {
        for (let i = 0; i < 7 - getLastDay(month, year); i++) {
          createDOMElement("span", daysContainer, {
            className: "day-cell",
            innerHTML: `<span></span>`
          });
        }
      }
    }

    const _createMonthContainer = function (month, year, eventObj, appendToTop) {
      const parentNode = document.createElement("div");
      parentNode.className = "month-container";
      const calendarContainer = document.getElementById("calendar");
      if (appendToTop) {
        calendarContainer.insertBefore(parentNode, calendarContainer.childNodes[0]);
      } else {
        calendarContainer.appendChild(parentNode);
      }
      _createHeader(month, year, parentNode);
      _createDayName(parentNode);
      _createDaysOfMonth(month, year, eventObj, parentNode);
    };

    return {
      createMonthContainer: _createMonthContainer,
      onScrollHandler: _onScrollHandler
    };
  })(helpers, globalStateModule);


  // intilize the app
  const _initApp = function () {
    popUpModule.initEvents();
    const { dateArr } = globalStateModule;
    const eventObj = JSON.parse(localStorage.getItem('eventObj')) || {};
    for (let i = 0; i < dateArr.length; i++) {
      calendarModule.createMonthContainer(dateArr[i].getMonth(), dateArr[i].getFullYear(), eventObj);
    }
    window.addEventListener('scroll', calendarModule.onScrollHandler.bind(null, eventObj));
  }
  return {
    initApp: _initApp
  }
})();