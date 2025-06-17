// Variable para almacenar las notificaciones en cola
let messageQueue = [];
let currentMessageIndex = 0;
let isAppVisible = false;
let hideTimeout = null;
let clockInterval = null;

// Función para mostrar popup inicial
function showInitialPopup() {
  g.clear();
  g.setColor(0, 0, 0.8); // Fondo azul oscuro
  g.fillRect(0, 0, 176, 176);
  
  g.setColor(1, 1, 1); // Texto blanco
  g.setFont("6x8", 2);
  g.setFontAlign(0, 0); // Centrar automáticamente
  
  g.drawString("Pleez ready", 88, 80);
  g.drawString("Waiting for signals...", 88, 100);
  
  g.flip();
  
  // Después de 2 segundos, ocultar la pantalla pero mantener la app activa
  setTimeout(function() {
    hideApp();
  }, 2000);
}

// Función para ocultar la pantalla (pero mantener la app activa)
function hideApp() {
  isAppVisible = false;
  showClock(); // Mostrar reloj en lugar de pantalla vacía
  console.log("App hidden but still active");
}

// Función para mostrar un reloj simple cuando la app está oculta
function showClock() {
  // Limpiar intervalo anterior si existe
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  
  function updateClock() {
    if (isAppVisible) {
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
      return; // No actualizar si la app está visible
    }
    
    let now = new Date();
    let hours = now.getHours().toString();
    if (hours.length < 2) hours = "0" + hours;
    let minutes = now.getMinutes().toString();
    if (minutes.length < 2) minutes = "0" + minutes;
    let seconds = now.getSeconds().toString();
    if (seconds.length < 2) seconds = "0" + seconds;
    
    g.clear();
    g.setColor(0, 0, 0); // Fondo negro
    g.fillRect(0, 0, 176, 176);
    
    // Hora principal
    g.setColor(1, 1, 1);
    g.setFont("Vector", 30);
    g.setFontAlign(0, 0);
    g.drawString(hours + ":" + minutes, 88, 70);
    
    // Segundos más pequeños
    g.setFont("Vector", 18);
    g.drawString(seconds, 88, 100);
    
    // Indicador de que Pleez está activo
    g.setColor(0, 0.5, 1);
    g.setFont("6x8", 1);
    g.drawString("Pleez Active", 88, 140);
    
    // Mostrar contador de mensajes pendientes si los hay
    if (messageQueue.length > 0) {
      g.setColor(1, 0.5, 0);
      g.drawString("(" + messageQueue.length + " pending)", 88, 155);
    }
    
    g.flip();
  }
  
  // Actualizar inmediatamente
  updateClock();
  
  // Configurar intervalo para actualizar cada segundo
  clockInterval = setInterval(updateClock, 1000);
}

// Función para añadir mensaje a la cola
function addMessageToQueue(message) {
  console.log("Adding message to queue:", message);
  messageQueue.push(message);
  console.log("Queue now has", messageQueue.length, "messages");
}

// Función para obtener el mensaje actual
function getCurrentMessage() {
  if (messageQueue.length === 0) return "";
  if (currentMessageIndex >= messageQueue.length) currentMessageIndex = 0;
  return messageQueue[currentMessageIndex];
}

// Función para pasar al siguiente mensaje (circular)
function nextMessage() {
  if (messageQueue.length === 0) return false;
  currentMessageIndex = (currentMessageIndex + 1) % messageQueue.length;
  console.log("Switched to message", currentMessageIndex + 1, "of", messageQueue.length);
  return true;
}

// Función para remover el mensaje actual de la cola
function removeCurrentMessage() {
  if (messageQueue.length === 0) return false;
  
  let removedMessage = messageQueue.splice(currentMessageIndex, 1)[0];
  console.log("Removed message:", removedMessage);
  
  // Ajustar índice si es necesario
  if (currentMessageIndex >= messageQueue.length) {
    currentMessageIndex = 0;
  }
  
  console.log("Queue now has", messageQueue.length, "messages");
  return messageQueue.length > 0;
}

// Función para mostrar la app
function showApp() {
  isAppVisible = true;
  
  // Limpiar intervalo del reloj si existe
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  
  // Cancelar cualquier timeout de ocultación pendiente
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  
  // CRITICAL: Ensure screen is unlocked and touchable
  Bangle.setLocked(false);
  
  redrawScreen();
  console.log("App shown - buttons available until pressed or FinTimer");
}

// Función para manejar mensajes recibidos desde la app del teléfono
function onGB(event) {
  console.log("GB event received:", event);
  
  if (event.t === "notify") {
    console.log("Mensaje procesado:", event.msg);
    
    // Si recibimos "FinTimer", solo ocultar si no hay más mensajes
    if (event.msg === "FinTimer") {
      console.log("FinTimer recibido");
      if (messageQueue.length === 0) {
        console.log("No hay mensajes pendientes, ocultando app");
        hideApp();
      } else {
        console.log("Hay", messageQueue.length, "mensajes pendientes, manteniendo app visible");
      }
      return;
    }
    
    // Añadir mensaje a la cola
    addMessageToQueue(event.msg);
    
    // Vibrar cuando llega un mensaje nuevo (siempre)
    try {
      Bangle.buzz(500); // Vibrar por 500ms
      console.log("Vibration sent");
    } catch (e) {
      console.log("Vibration error:", e);
    }
    
    // Si la app no está visible, mostrarla
    if (!isAppVisible) {
      showApp();
    } else {
      // Si ya está visible, solo redibujar para mostrar el contador actualizado
      redrawScreen();
    }
  }
}

// Dibujar la pantalla completa (mensaje y botones)
function redrawScreen() {
  // Force unlock before drawing
  Bangle.setLocked(false);
  
  g.clear();
  g.setColor(0, 0, 1); // Fondo azul
  g.fillRect(0, 0, 176, 176);
  
  // Mostrar mensaje actual en la parte superior (sin "Señal:")
  g.setColor(1, 1, 1);
  g.setFont("6x8", 2);
  g.setFontAlign(-1, -1); // Alineación izquierda-superior
  
  let currentMsg = getCurrentMessage();
  g.drawString(currentMsg, 10, 10);
  
  // Mostrar contador de mensajes si hay más de uno
  if (messageQueue.length > 1) {
    g.setColor(1, 1, 0); // Amarillo para el contador
    g.setFont("6x8", 1);
    g.setFontAlign(1, -1); // Alineación derecha-superior
    g.drawString((currentMessageIndex + 1) + "/" + messageQueue.length, 166, 10);
  }
  
  // Dibujar botones principales (más grandes)
  drawButtons();
  
  // Dibujar botón de navegación si hay múltiples mensajes (abajo)
  if (messageQueue.length > 1) {
    drawNavigationButton();
  }
  
  g.flip();
}

// Función separada para dibujar botones principales (más grandes)
function drawButtons() {
  // Botón Ok (verde) - más grande
  g.setColor(0, 0.8, 0);
  g.fillRect(10, 60, 86, 120);
  
  // Botón Postpone (rojo) - más grande
  g.setColor(0.8, 0, 0);
  g.fillRect(90, 60, 166, 120);
  
  // Texto de los botones
  g.setColor(1, 1, 1);
  g.setFont("6x8", 3);
  g.setFontAlign(0, 0); // Centrado
  g.drawString("OK", 48, 90);
  g.drawString("WAIT", 128, 90);
}

// Función para dibujar botón de navegación (abajo)
function drawNavigationButton() {
  // Botón de navegación (centrado abajo)
  g.setColor(0.5, 0.5, 0.5);
  g.fillRect(10, 140, 166, 166);
  
  // Texto del botón de navegación
  g.setColor(1, 1, 1);
  g.setFont("6x8", 2);
  g.setFontAlign(0, 0);
  g.drawString("NEXT MESSAGE", 88, 153);
}

// Feedback visual para botones
function buttonFeedback(buttonType) {
  let x1, x2, y1, y2, text, fontSize;
  
  switch(buttonType) {
    case "ok":
      x1 = 10; x2 = 86; y1 = 60; y2 = 120; text = "OK"; fontSize = 3;
      break;
    case "wait":
      x1 = 90; x2 = 166; y1 = 60; y2 = 120; text = "WAIT"; fontSize = 3;
      break;
    case "next":
      x1 = 10; x2 = 166; y1 = 140; y2 = 166; text = "NEXT MESSAGE"; fontSize = 2;
      break;
  }
  
  // Cambiar color temporalmente para feedback
  g.setColor(1, 1, 1); // Color blanco para feedback
  g.fillRect(x1, y1, x2, y2);
  
  g.setColor(0, 0, 0); // Texto negro para contraste
  g.setFont("6x8", fontSize);
  g.setFontAlign(0, 0);
  g.drawString(text, (x1 + x2) / 2, (y1 + y2) / 2);
  g.flip();
}

// Manejar toques en la pantalla
Bangle.on("touch", function (button, xy) {
  // Si la app está oculta, NO hacer nada
  if (!isAppVisible) {
    console.log("App hidden - touch ignored");
    return;
  }
  
  console.log("Touch detected at: x=" + xy.x + ", y=" + xy.y);
  
  // Botón de navegación (si hay múltiples mensajes)
  if (messageQueue.length > 1 && xy.y >= 140 && xy.y <= 166) {
    console.log("NEXT button pressed!");
    buttonFeedback("next");
    setTimeout(function() {
      nextMessage();
      redrawScreen();
    }, 200);
    return;
  }
  
  // Botones principales (OK/WAIT) - nueva posición
  if (xy.y >= 60 && xy.y <= 120) {
    let message = null;
    let buttonType = null;
    
    // Botón OK (izquierda)
    if (xy.x >= 10 && xy.x <= 86) {
      message = "Ok";
      buttonType = "ok";
      console.log("OK button pressed!");
    } 
    // Botón WAIT (derecha)
    else if (xy.x >= 90 && xy.x <= 166) {
      message = "Postpone";
      buttonType = "wait";
      console.log("WAIT button pressed!");
    }
    
    // Si se presionó un botón válido
    if (message && buttonType) {
      console.log("Sending message:", message);
      
      // Mostrar feedback visual inmediato
      buttonFeedback(buttonType);
      
      // Enviar respuesta por Bluetooth
      try {
        Bluetooth.println(JSON.stringify({ 
          t: "notify", 
          msg: message, 
          timerName: getCurrentMessage()
        }));
        console.log("Bluetooth message sent successfully:", message);
        
        // Remover mensaje actual de la cola
        setTimeout(function() {
          let hasMoreMessages = removeCurrentMessage();
          
          if (hasMoreMessages) {
            // Si hay más mensajes, mostrar el siguiente
            console.log("More messages available, showing next");
            redrawScreen();
          } else {
            // Si no hay más mensajes, ocultar app
            console.log("No more messages, hiding app");
            hideApp();
          }
        }, 500);
        
      } catch (e) {
        console.log("Error sending Bluetooth message:", e);
      }
    }
  }
});

// Manejar botón físico para mostrar/ocultar
setWatch(function() {
  if (isAppVisible) {
    hideApp();
  } else {
    showApp();
  }
}, BTN, { repeat: true, edge: "falling" });

// Registrar el manejador de eventos Gadgetbridge
GB = onGB;

// Configuración inicial
NRF.setAdvertising({}, { connectable: true });

// Deshabilitar seguimiento de actividad para evitar interferencias
Bangle.setOptions({ 
  hrmPollInterval: 0,
  wakeOnBTN1: false, // Evitar despertar accidental
  wakeOnBTN2: true,  // Permitir despertar con BTN2
  wakeOnBTN3: false,
  wakeOnTouch: true, // Permitir despertar con toque
  lockTimeout: 0,    // Disable screen lock completely
  backlightTimeout: 0, // Keep screen always on when app is visible
  lcdPowerTimeout: 0   // Prevent LCD from turning off
});

// Force unlock the screen at startup
Bangle.setLocked(false);

if (Bangle.setStepCount) Bangle.setStepCount(0);
Bangle.removeAllListeners('step');
Bangle.removeAllListeners('health');
Bangle.removeAllListeners('HRM');

// Mostrar popup inicial
console.log("Pleez app with message queue started");
showInitialPopup();
