/////////
// GUI //
/////////

ez._guiUpdateInputWithValue =function(path, value) {
  const inputElement = document.querySelector(`[data-path='${path}']`);
  if (inputElement) {
      if (inputElement.type === "checkbox") {
          inputElement.checked = value;
      } else if (inputElement.tagName.toLowerCase() === "select") {
          inputElement.value = value;
      } else {
          inputElement.value = value;
      }
  }
}

ez._guiTransformDataProperties = function(data, path, callbacks = {}, allDataPaths_out = []) {
  Object.keys(data).forEach((key) => {
      let internalValue = data[key];
      const currentPath = [...path, key].join(".");

      allDataPaths_out.push(currentPath);

      if (Array.isArray(internalValue)) {
          data[key] = internalValue[0]; // Set the data object to the first value of the array by default
      }

      if (typeof internalValue !== "object" || internalValue instanceof Function || Array.isArray(internalValue)) {
          Object.defineProperty(data, key, {
              get() {
                  return internalValue;
              },
              set(newValue) {
                  internalValue = newValue;
                  ez._guiUpdateInputWithValue(currentPath, newValue);
                  const catchallCallback = callbacks["*"];
                  const specificCallback = callbacks[currentPath];
                  if (specificCallback) {
                      specificCallback(newValue, currentPath);
                  }
                  if (catchallCallback) {
                      catchallCallback(newValue, currentPath);
                  }
              },
              enumerable: true,
              configurable: true,
          });
      } else if (typeof internalValue === "object" && !Array.isArray(internalValue) && internalValue !== null) {
          ez._guiTransformDataProperties(internalValue, [...path, key], callbacks, allDataPaths_out); // Recursive call for nested objects
      }
  });
}
ez._addMouseScrubListenersToNumberInput = function(numberInput, newValCallback) {
  let startX;
  let startValue;

  const onMouseDown = (e) => {
      // Ensure interaction starts only with the left mouse button
      if (e.button !== 0) return;
      
      // Clear any existing text selection before starting drag
      if (window.getSelection().toString()) {
          window.getSelection().removeAllRanges();
      }
      
      startX = e.pageX;
      startValue = parseFloat(numberInput.value);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
      const dx = e.pageX - startX;
      const baseSensitivity = 0.01;
      let step = parseFloat(numberInput.getAttribute('scrollStep') || numberInput.getAttribute('step') || `${baseSensitivity}`);
      let min = parseFloat(numberInput.getAttribute('min') || '-Infinity');
      let max = parseFloat(numberInput.getAttribute('max') || 'Infinity');
      
      // Scale sensitivity relative to step size to handle large steps
      const sensitivity = baseSensitivity * Math.max(1, step);
      
      // Calculate value change based on physical mouse movement
      let deltaValue = dx * sensitivity;
      
      // Preserve fractional changes until they accumulate to at least one step
      let effectiveValue = startValue + deltaValue;
      
      // Apply step increments while maintaining smooth dragging
      if (step > 0) {
          effectiveValue = Math.round(effectiveValue / step) * step;
      }
      
      // Clamp between min and max
      let newValue = Math.min(max, Math.max(min, effectiveValue));
      
      // Round to 10 decimal places to prevent floating point precision issues
      newValue = Math.round(newValue * 1e10) / 1e10;
      
      numberInput.value = newValue;
      newValCallback(newValue);
  };

  const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
  };

  const onWheel = (e) => {
      // Prevent default scroll behavior
      e.preventDefault();
      
      let step = parseFloat(numberInput.getAttribute('scrollStep') || numberInput.getAttribute('step') || '1');
      let min = parseFloat(numberInput.getAttribute('min') || '-Infinity');
      let max = parseFloat(numberInput.getAttribute('max') || 'Infinity');
      
      // Get current value
      let currentValue = parseFloat(numberInput.value) || 0;
      
      // Determine direction (negative deltaY means scroll up, positive means scroll down)
      let direction = e.deltaY < 0 ? 1 : -1;
      
      // Calculate new value
      let newValue = currentValue + (direction * step);

      // Round to 10 decimal places to prevent floating point precision issues
      newValue = Math.round(newValue * 1e10) / 1e10;
      
      // Clamp between min and max
      newValue = Math.min(max, Math.max(min, newValue));
      
      // Update input and call callback
      numberInput.value = newValue;
      newValCallback(newValue);
  };

  numberInput.addEventListener('mousedown', onMouseDown);
  numberInput.addEventListener('wheel', onWheel, { passive: false });
}

ez._guiGenerateForm = function(dataObject, path) {
  const formContainer = document.createElement("div");

  const setPathValue = (path, value) => {
      let tempData = dataObject;
      for (let i = 0; i < path.length - 1; i++) {
          tempData = tempData[path[i]];
      }
      tempData[path[path.length - 1]] = value;
  }

  let nestedObjForRecur = dataObject;
  for(let i = 0; i < path.length; i++) {
      nestedObjForRecur = nestedObjForRecur[path[i]];
  }

  Object.entries(nestedObjForRecur).forEach(([key, value]) => {
      // Skip properties that start with underscore
      if (key == '_hints') return;

      const currentPath = [...path, key];

      if (typeof value === "function") {
          // Make functions buttons
          const button = document.createElement("button");
          button.classList.add("control");
          button.textContent = key;
          button.onclick = value;
          button.setAttribute("data-path", currentPath);
          formContainer.appendChild(button);

          if(dataObject._hints && dataObject._hints[key] && dataObject._hints[key].hidden && dataObject._hints[key].hidden === true) {
              button.style.display = "none";
          }
      } else if (Array.isArray(value)) {
          // Make arrays dropdowns
          const label = document.createElement("label");
          const labelText = document.createElement("span");
          labelText.innerText = key;
          labelText.title = key;
          labelText.classList.add("text")
          label.appendChild(labelText);

          const select = document.createElement("select");
          select.setAttribute("data-path", currentPath);
          value.forEach((option) => {
              const optionElement = document.createElement("option");
              optionElement.value = option;
              optionElement.textContent = option;
              select.appendChild(optionElement);
          });
          select.value = value[0]; // Default to first array element
          select.addEventListener("change", (e) => {
              setPathValue(currentPath, select.options[select.selectedIndex].value);
          });

          const control = document.createElement("span");
          control.classList.add("control");
          control.appendChild(select);
          label.appendChild(control);
          formContainer.appendChild(label);

          if(dataObject._hints && dataObject._hints[key] && dataObject._hints[key].hidden && dataObject._hints[key].hidden === true) {
              label.style.display = "none";
          }
      } else if (typeof value === "object" && !Array.isArray(value) && value !== null) {
          // Make nested objects collapsible sections
          const button = document.createElement("button");
          button.className = "collapsible";
          button.innerText = key;

          const contentDiv = document.createElement("div");
          contentDiv.className = "collapsible-content";
          contentDiv.appendChild(ez._guiGenerateForm(dataObject, currentPath)); // Recursive call for nested objects
          contentDiv.style.display = "none";

          button.addEventListener("click", function () {
              contentDiv.style.display = contentDiv.style.display === "none" ? "block" : "none";
              if (contentDiv.style.display === "none") {
                  button.classList.remove("expanded");
              } else {
                  button.classList.add("expanded");
              }
          });

          formContainer.appendChild(button);
          formContainer.appendChild(contentDiv);

          if(dataObject._hints && dataObject._hints[key] && dataObject._hints[key].hidden && dataObject._hints[key].hidden === true) {
              contentDiv.style.display = "none";
          }
      } else {
          // Make text, boolean, or numbers as text, checkbox, or number inputs
          const label = document.createElement("label");
          const labelText = document.createElement("span");
          labelText.innerText = key;
          labelText.title = key;
          labelText.classList.add("text")
          label.appendChild(labelText);

          let inputType = "text";
          if (typeof value === "boolean") {
              inputType = "checkbox";
          } else if (typeof value === "number") {
              inputType = "number";
          }

          const input = document.createElement("input");
          input.type = inputType;
          input.setAttribute("data-path", currentPath.join("."));
          input.name = currentPath.join(".");
          input.value = inputType === "checkbox" ? "" : value;
          input.checked = inputType === "checkbox" ? value : false;

          // Apply input attributes if they exist in the hints
          if (dataObject._hints && dataObject._hints[key]) {
              Object.entries(dataObject._hints[key]).forEach(([attr, val]) => {
                  if(attr === "hidden") {
                      if(val === true) {
                          label.style.display = "none";
                      }
                  } else {
                      input.setAttribute(attr, val);
                  }
              });
          }

          if(input.type === "number") {
              ez._addMouseScrubListenersToNumberInput(input, (newValue) => setPathValue(currentPath, Number(newValue)));
          }

          input.addEventListener("change", (e) => {
              const newValue = inputType === "checkbox" ? input.checked : input.value;
              setPathValue(currentPath, inputType === "number" ? Number(newValue) : newValue);
          });

          const control = document.createElement("span");
          control.classList.add("control");
          control.appendChild(input);
          label.appendChild(control);
          formContainer.appendChild(label);
      }
  });

  return formContainer;
}

ez._updateVisibilityClasses = function(formContainer) {
  // Remove existing classes
  const labels = formContainer.querySelectorAll('label');
  labels.forEach(label => {
      label.classList.remove('ezgui-first-visible', 'ezgui-last-visible');
  });

  // Find visible labels
  const visibleLabels = Array.from(labels).filter(label => 
      label.style.display !== 'none' && 
      getComputedStyle(label).display !== 'none'
  );

  // Add classes to first and last visible labels
  if (visibleLabels.length > 0) {
      visibleLabels[0].classList.add('ezgui-first-visible');
      visibleLabels[visibleLabels.length - 1].classList.add('ezgui-last-visible');
  }
};

ez._guiInjectStyles = function(palette, theme = 'default', darkMode = false) {
  const isMinimalist = theme === 'minimalist';
  const fontFamily = isMinimalist ? 
      "'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" :
      "'Lucida Grande', sans-serif";
  
  const styles = isMinimalist ? `
      @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&display=swap');

      .ezgui-floating-window {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: min(320px, 90vw);
          max-width: 100%;
          background-color: ${palette.tertiaryBackground};
          color: ${palette.primaryText};
          font-family: ${fontFamily};
          font-size: 13px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border: 1px solid ${palette.borderColor};
          overflow: visible;
          display: flex;
          flex-direction: column;
      }

      .ezgui-floating-window form {
          order: 1;
          border-radius: 12px;
          overflow: hidden;
      }

      button.ezgui-close-controls {
          order: 2;
          background-color: transparent;
          color: ${palette.highlightText};
          font: 600 14px ${fontFamily};
          border: none;
          padding: 12px 16px;
          cursor: pointer;
          position: relative;
          text-align: left;
          transition: background-color 0.2s ease;
          border-top: 1px solid ${palette.borderColor};
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
      }

      button.collapsible {
          width: 100%;
          background-color: transparent;
          color: ${palette.highlightText};
          font: 600 14px ${fontFamily};
          border: none;
          padding: 12px 16px;
          cursor: pointer;
          position: relative;
          text-align: left;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid ${palette.borderColor};
      }

      button.collapsible:first-child {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
      }

      .ezgui-floating-window label {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          cursor: pointer;
          color: ${palette.highlightText};
          transition: background-color 0.2s ease;
          position: relative;
          user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
      }

      .ezgui-floating-window label.ezgui-first-visible {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
      }

      .ezgui-floating-window label.ezgui-last-visible {
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
      }

      .ezgui-floating-window label:hover {
          background-color: ${palette.secondaryBackground};
      }

      .ezgui-floating-window label > .text {
          flex: 1;
          font-weight: 600;
          margin-right: 12px;
          user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
      }

      .ezgui-floating-window label > .control {
          flex: 1.2;
          display: flex;
          justify-content: center;
          align-items: center;
          user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
      }

      .ezgui-floating-window input[type="text"],
      .ezgui-floating-window input[type="number"] {
          width: 100%;
          background-color: ${palette.primaryBackground};
          color: ${palette.primaryText};
          border: 1px solid ${palette.borderColor};
          padding: 8px 12px;
          border-radius: 8px;
          font-family: ${fontFamily};
          font-size: 13px;
          transition: border-color 0.2s ease;
          user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
      }

      .ezgui-floating-window input[type="text"]:focus,
      .ezgui-floating-window input[type="number"]:focus {
          outline: none;
          border-color: ${palette.accentBackground};
      }

      .ezgui-floating-window input[type="checkbox"] {
          appearance: none;
          width: 40px;
          height: 20px;
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s ease;
          background-color: ${theme === 'minimalist' && !darkMode ? palette.primaryBackground : palette.secondaryBackground};
          border: 1px solid ${palette.borderColor};
      }

      .ezgui-floating-window input[type="checkbox"]:checked {
          background-color: ${palette.accentBackground};
      }

      .ezgui-floating-window input[type="checkbox"]:before {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          top: 1px;
          left: 1px;
          background-color: ${theme === 'minimalist' && !darkMode ? palette.tertiaryBackground : palette.highlightText};
          transition: transform 0.2s ease;
          box-shadow: ${theme === 'minimalist' && !darkMode ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};
      }

      .ezgui-floating-window input[type="checkbox"]:checked:before {
          transform: translateX(20px);
      }

      .ezgui-floating-window button.control {
          width: 100%;
          background-color: ${palette.secondaryBackground};
          color: ${palette.highlightText};
          border: 1px solid ${palette.borderColor};
          padding: 8px 16px;
          border-radius: 12px;
          font-family: ${fontFamily};
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
      }

      .ezgui-floating-window button.control:hover {
          background-color: ${palette.secondaryBackground};
          border-color: ${palette.accentBackground};
          color: ${palette.highlightText};
      }

      .collapsible-content {
          border-left: 5px solid ${palette.accentBackground};
      }

      button.collapsible::before {
          content: '';
          display: inline-block;
          width: 7px;
          height: 7px;
          background-image: url(${'data:image/svg+xml;base64,'+btoa("<svg xmlns='http://www.w3.org/2000/svg' width='5' height='5' viewBox='0 0 5 5'><polygon points='2,0 5,2.5 2,5' fill='"+palette.highlightText+"'/></svg>")});
          background-size: contain;
          background-repeat: no-repeat;
          margin-right: 8px;
          vertical-align: middle;
      }
      
      button.collapsible.expanded::before {
          background-image: url(${'data:image/svg+xml;base64,'+btoa("<svg xmlns='http://www.w3.org/2000/svg' width='5' height='5' viewBox='0 0 5 5'><polygon points='0,2 5,2 2.5,5' fill='"+palette.highlightText+"'/></svg>")});
      }

      .ezgui-floating-window select {
          width: 100%;
          background-color: ${palette.primaryBackground};
          color: ${palette.primaryText};
          border: 1px solid ${palette.borderColor};
          padding: 8px 12px;
          border-radius: 8px;
          font-family: ${fontFamily};
          font-size: 13px;
          transition: border-color 0.2s ease;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url(${'data:image/svg+xml;base64,'+btoa("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='"+palette.primaryText+"' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")});
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 10px;
          padding-right: 32px;
      }

      .ezgui-floating-window select:focus {
          outline: none;
          border-color: ${palette.accentBackground};
      }

      .ezgui-floating-window select:hover {
          background-color: ${palette.secondaryBackground};
      }

      .ezgui-floating-window select option {
          background-color: ${palette.primaryBackground};
          color: ${palette.primaryText};
          padding: 8px;
      }

      @media (max-width: 680px) {
          .ezgui-floating-window {
              width: min(85vw, 280px);
              font-size: 11px;
              bottom: 10px;
              right: 10px;
              border-radius: 8px;
          }

          button.ezgui-close-controls,
          button.collapsible,
          .ezgui-floating-window button.control,
          .ezgui-floating-window input[type="text"],
          .ezgui-floating-window input[type="number"],
          .ezgui-floating-window select,
          .ezgui-floating-window label > .text {
              font-size: 11px;
          }

          .ezgui-floating-window label {
              padding: 8px 12px;
          }

          .ezgui-floating-window input[type="checkbox"] {
              width: 36px;
              height: 18px;
          }

          .ezgui-floating-window input[type="checkbox"]:before {
              width: 14px;
              height: 14px;
          }

          .ezgui-floating-window input[type="number"],
          .ezgui-floating-window input[type="text"],
          .ezgui-floating-window select {
              padding: 6px 10px;
          }

          .ezgui-floating-window button.collapsible {
              padding: 10px 12px;
          }
      }
  ` : `
      .ezgui-floating-window {
          position: absolute;
          top: 10px;
          right: 10px;
          width: min(420px, 92vw);
          max-width: 100%;
          background-color: ${palette.tertiaryBackground};
          color: ${palette.primaryText};
          font-family: 'Lucida Grande', sans-serif;
          font-size: 12px;
          display: flex;
          flex-direction: column;
      }

      .ezgui-floating-window form {
          order: 1;
      }

      button.ezgui-close-controls {
          order: 2;
          width: 100%;
          background-color: ${palette.accentBackground};
          color: ${palette.highlightText};
          font-size: 11px;
          border: none;
          padding: 7px;
          cursor: pointer;
          position: relative;
          border-radius: 0;
          border-top: 1px solid ${palette.secondaryBackground};
      }

      button.collapsible {
          width: 100%;
          background-color: ${palette.accentBackground};
          color: ${palette.highlightText};
          font-size: 11px;
          border: none;
          padding: 7px;
          cursor: pointer;
          position: relative;
          border-radius: 0;
          text-align: left;
          border-bottom: 1px solid ${palette.secondaryBackground};
          user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
      }

      button.ezgui-close-controls:hover, button.collapsible:hover {
          background-color: ${palette.secondaryBackground};
      }

      button.collapsible::before {
          content: '';
          display: inline-block;
          width: 7px;
          height: 7px;
          background-image: url(${'data:image/svg+xml;base64,'+btoa("<svg xmlns='http://www.w3.org/2000/svg' width='5' height='5' viewBox='0 0 5 5'><polygon points='2,0 5,2.5 2,5' fill='"+palette.highlightText+"'/></svg>")});
          background-size: contain;
          background-repeat: no-repeat;
          margin-right: 8px;
          vertical-align: middle;
      }
      
      button.collapsible.expanded::before {
          background-image: url(${'data:image/svg+xml;base64,'+btoa("<svg xmlns='http://www.w3.org/2000/svg' width='5' height='5' viewBox='0 0 5 5'><polygon points='0,2 5,2 2.5,5' fill='"+palette.highlightText+"'/></svg>")});
      }
      
      .ezgui-floating-window label {
          display: block;
          padding: 4px;
          cursor: pointer;
          border-bottom: 1px solid ${palette.secondaryBackground};
          color: ${palette.highlightText};
          overflow: hidden;
          white-space: nowrap;
      }

      .ezgui-floating-window label > .text, .ezgui-floating-window label > .control {
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
      }

      .ezgui-floating-window label > .text {
          width: 40%;
          border-radius: 0px;
          border: 0px;
          padding: 0 4px 0 5px;
          user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
      }

      .ezgui-floating-window label > .control {
          text-align: left;
          width: 60%;
      }

      .ezgui-floating-window button.control {
          padding: 4px 4px 4px 9px;
          text-align: left;
          background-color: transparent;
          color: ${palette.highlightText};
          border: 0px;
          width: 100%;
      }
      .ezgui-floating-window button.control:hover {
          background-color: ${palette.secondaryBackground};
          cursor: pointer;
          color: ${palette.highlightText};
          border: 0px;
          width: 100%;
      }

      .ezgui-floating-window input {
          background-color: ${palette.primaryBackground};
          color: ${palette.primaryText};
          border: 1px solid ${palette.secondaryBackground};
          padding: 2px 4px;
          border-radius: 2px;
      }
      .ezgui-floating-window input[type="text"], .ezgui-floating-window input[type="number"] {
          outline: none;
      }
      .ezgui-floating-window select {
          outline: none;
      }

      @media (max-width: 680px) {
          .ezgui-floating-window {
              width: min(85vw, 280px);
              font-size: 10px;
          }

          button.ezgui-close-controls,
          button.collapsible,
          .ezgui-floating-window button.control,
          .ezgui-floating-window input,
          .ezgui-floating-window select,
          .ezgui-floating-window label > .text,
          .ezgui-floating-window label > .control {
              font-size: 10px;
          }

          button.ezgui-close-controls,
          button.collapsible {
              padding: 6px;
          }

          .ezgui-floating-window label {
              padding: 5px 8px;
          }
      }
  `;

  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

ez.guiPalettes = {
  default: {
      primaryText: "#2FA1CC",
      highlightText: "#FFF",
      primaryBackground: "#303030",
      secondaryBackground: "#3C3C3C",
      tertiaryBackground: "#1A1A1A",
      accentBackground: "#000",
  },
  minimalist: {
      light: {
          primaryText: "#4a4036",
          highlightText: "#2d2420",
          primaryBackground: "#faf6f1",
          secondaryBackground: "#fff8eb",
          tertiaryBackground: "#ffffff",
          accentBackground: "#c17817",
          borderColor: "#e6dfd7"
      },
      dark: {
          primaryText: "#e1d4c9",
          highlightText: "#c8b8aa",
          primaryBackground: "#1a1a1a",
          secondaryBackground: "#2a2a2a",
          tertiaryBackground: "#242424",
          accentBackground: "#333333",
          borderColor: "#333333"
      }
  }
};

ez.gui = function(data, callbacks = {}, options = {}) {
  const theme = options.theme || 'default';
  const palette = theme === 'minimalist' ? 
      (options.darkMode ? ez.guiPalettes.minimalist.dark : ez.guiPalettes.minimalist.light) :
      ez.guiPalettes.default;

  let allDataPaths = []
  ez._guiTransformDataProperties(data, [], callbacks, allDataPaths);
  const form = ez._guiGenerateForm(data, [], callbacks);
  
  // Update visibility classes for proper border radius handling
  if (theme === 'minimalist') {
      ez._updateVisibilityClasses(form);
  }
  
  const floatingWindow = document.createElement("div");

  if (!options.hideControlsButton) {
      const closeControlsButton = document.createElement("button");
      closeControlsButton.innerText = theme === 'minimalist' ? 'Controls' : 'Close Controls';
      closeControlsButton.title = "Alt-Click to hide entire window, Alt+H to bring it back.";
      closeControlsButton.classList.add("ezgui-close-controls");

      closeControlsButton.onclick = (e) => {
          if(e.altKey) {
              floatingWindow.style.display = "none";
          }
          else {
              form.style.display = form.style.display === "none" ? "" : "none";
              closeControlsButton.innerText = form.style.display === "none" ? 
                  (theme === 'minimalist' ? 'Controls' : 'Open Controls') : 
                  (theme === 'minimalist' ? 'Controls' : 'Close Controls');
          }
      }
      floatingWindow.appendChild(closeControlsButton);
  }

  // Toggle hide floating window with alt + h
  document.addEventListener("keydown", (e) => {
      if((e.key === "h" || e.key === "H") && e.altKey && floatingWindow.checkVisibility()) {
          floatingWindow.style.display = "none";
      }
      else if ((e.key === "h" || e.key === "H") && e.altKey && !floatingWindow.checkVisibility()) {
          floatingWindow.style.display = "";
      }
  })

  floatingWindow.appendChild(form);
  floatingWindow.classList.add("ezgui-floating-window");

  let container = window?.ez?.canvas || options?.container || document.body;
  container.appendChild(floatingWindow);

  if (!options?.noStyling) {
      ez._guiInjectStyles(palette, theme, options.darkMode);
  }

  const endsInKeyRegex = /.*\[(.)\]$/;
  const endsInSpaceRegex = /.*\[(space|spacebar)\]$/i;
  let dataPathsEndingInKey = allDataPaths.filter(path => !path.startsWith("_hints")).filter(path => endsInKeyRegex.test(path))
  let keyPathMap = {}
  dataPathsEndingInKey.forEach(path => {keyPathMap[path.slice(-2)[0].toLowerCase()] = path})
  document.addEventListener("keypress", (e) => {
      const textInputTypes = ["text", "password", "email", "url", "search", "tel", "date", "time", "datetime-local", "month", "week"]
      if ((document.activeElement.tagName === "INPUT" &&  textInputTypes.indexOf(document.activeElement.type.toLowerCase()) !== -1) || document.activeElement.tagName === "TEXTAREA") {
          return;
      }

      if (document.activeElement.tagName === "INPUT" && document.activeElement.type === "number" &&
          ((e.key >= '0' && e.key <= '9') || e.key === '.' || e.key === ',')) {
          return;
      }

      if (e.key === ' ') {
          const spacebarPath = allDataPaths.find(path => endsInSpaceRegex.test(path));
          if (spacebarPath) {
              const inputElement = document.querySelector(`[data-path='${spacebarPath}']`);
              if (inputElement) {
                  inputElement.click();
                  if(document.activeElement.tagName === "INPUT" && document.activeElement !== inputElement) {
                      document.activeElement.blur();
                  }
                  e.preventDefault();
                  e.stopPropagation();
              }
          }
      }

      let keyToPath = keyPathMap[e.key.toLowerCase()];
      if (keyToPath) {
          const inputElement = document.querySelector(`[data-path='${keyToPath}']`);
          if (inputElement) {
              // If it's a dropdown (select), cycle to next option and wrap around
              if (inputElement.tagName && inputElement.tagName.toLowerCase() === 'select') {
                  const total = inputElement.options.length;
                  if (total > 0) {
                      if (e.shiftKey) {
                          inputElement.selectedIndex = (inputElement.selectedIndex - 1 + total) % total;
                      } else {
                          inputElement.selectedIndex = (inputElement.selectedIndex + 1) % total;
                      }
                      // Trigger change so data object updates via ez._guiGenerateForm's listener
                      const changeEvent = new Event('change', { bubbles: true });
                      inputElement.dispatchEvent(changeEvent);
                  }
              } else {
                  // Fallback to click behavior (e.g., checkbox toggles)
                  inputElement.click();
              }
          }
      }
  });

  return floatingWindow;
}