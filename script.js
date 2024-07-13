const svg = document.getElementById('networkSvg');
const ns = "http://www.w3.org/2000/svg";
let network = [];
let signals = [];
let animationSpeed = 1;
let isRunning = false;
let animationFrame;

const cycleCounterElement = document.getElementById('cycleCounter');
let cycleCounter = 0; // Initialize cycle counter
let cyclePending = false; // Flag to track if a cycle is in progress

const layerColors = ['#ff6347', '#5d9afb', '#45b7d1', '#f7b731', '#C3B1E1'];

function initializeNetwork() {
    const layers = [3, 6, 4, 6, 4];
    network = [];
    signals = [];
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    let x = 100;
    const layerSpacing = (svgWidth - 200) / (layers.length - 1);

    for (let i = 0; i < layers.length; i++) {
        let layer = [];
        let y = svgHeight / (layers[i] + 1);
        for (let j = 0; j < layers[i]; j++) {
            if (i === 0) {
                // Initialize input layer nodes with random activation values
                layer.push({ x: x, y: y * (j + 1), activation: Math.random() }); // Random value between 0 and 1
            } else {
                layer.push({ x: x, y: y * (j + 1), activation: 0 });
            }
        }
        network.push(layer);
        x += layerSpacing;
    }

    initializeSignals();
    createInputs();
    drawNetwork();
}

function initializeSignals() {
    signals = [];
    for (let i = 0; i < network.length - 1; i++) {
        for (let j = 0; j < network[i].length; j++) {
            for (let k = 0; k < network[i + 1].length; k++) {
                signals.push({
                    x: network[i][j].x,
                    y: network[i][j].y,
                    targetX: network[i + 1][k].x,
                    targetY: network[i + 1][k].y,
                    progress: 0,
                    active: false,
                    sourceLayer: i,
                    targetLayer: i + 1
                });
            }
        }
    }
}

function drawNetwork() {
    svg.innerHTML = '';

    // Draw initial white connectors
    signals.forEach(signal => {
        const initialLine = document.createElementNS(ns, 'line');
        initialLine.setAttribute('x1', signal.x);
        initialLine.setAttribute('y1', signal.y);
        initialLine.setAttribute('x2', signal.targetX);
        initialLine.setAttribute('y2', signal.targetY);
        initialLine.setAttribute('stroke', 'white');
        initialLine.setAttribute('stroke-width', '2');
        initialLine.setAttribute('stroke-opacity', '0.02'); 
        svg.appendChild(initialLine);
    });

    // Draw connections
    signals.forEach(signal => {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', signal.x);
        line.setAttribute('y1', signal.y);
        line.setAttribute('x2', signal.targetX);
        line.setAttribute('y2', signal.targetY);
        line.setAttribute('stroke-width', '1');
        
        // Calculate opacity based on the target node's activation
        const targetNode = network[signal.targetLayer].find(node => node.x === signal.targetX && node.y === signal.targetY);
        const opacity = targetNode ? Math.pow(targetNode.activation, 2) : 1.0;
        line.setAttribute('stroke-opacity', opacity);

        // Set color to red if activation matches the maximum activation within this pair of layers
        const maxActivation = getMaxActivationInLayerPair(signal.sourceLayer, signal.targetLayer);
        if (targetNode && targetNode.activation === maxActivation) {
            line.setAttribute('stroke', '#ff6347');
        } else {
            line.setAttribute('stroke', '#4CAF50');
        }
        
        svg.appendChild(line);
    });

    // Draw nodes
    network.forEach((layer, layerIndex) => {
        layer.forEach(node => {
            const circle = document.createElementNS(ns, 'circle');
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', '20');
            circle.setAttribute('fill', layerColors[layerIndex]);
            svg.appendChild(circle);

            const text = document.createElementNS(ns, 'text');
            text.setAttribute('x', node.x);
            text.setAttribute('y', node.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('fill', '#1e1e1e');
            text.setAttribute('font-family', 'Poppins');
            text.setAttribute('font-weight', 600);
            text.textContent = node.activation.toFixed(2);
            svg.appendChild(text);

            // Hover effect
            text.addEventListener('mouseover', () => {
                const tooltip = document.createElementNS(ns, 'text');
                tooltip.setAttribute('x', node.x);
                tooltip.setAttribute('y', node.y - 30);
                tooltip.setAttribute('text-anchor', 'middle');
                tooltip.setAttribute('fill', '#ffffff');
                tooltip.textContent = `Layer ${layerIndex + 1}, Node ${layer.indexOf(node) + 1}`;
                tooltip.id = 'tooltip';
                svg.appendChild(tooltip);
            });

            text.addEventListener('mouseout', () => {
                const tooltip = document.getElementById('tooltip');
                if (tooltip) tooltip.remove();
            });

            circle.addEventListener('mouseover', () => {
                const tooltip = document.createElementNS(ns, 'text');
                tooltip.setAttribute('x', node.x);
                tooltip.setAttribute('y', node.y - 30);
                tooltip.setAttribute('text-anchor', 'middle');
                tooltip.setAttribute('fill', '#ffffff');
                tooltip.textContent = `Layer ${layerIndex + 1}, Node ${layer.indexOf(node) + 1}`;
                tooltip.id = 'tooltip';
                svg.appendChild(tooltip);
            });

            circle.addEventListener('mouseout', () => {
                const tooltip = document.getElementById('tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    });

    function getMaxActivationInLayerPair(sourceLayer, targetLayer) {
        let maxActivation = 0;
        signals.filter(signal => signal.sourceLayer === sourceLayer && signal.targetLayer === targetLayer).forEach(signal => {
            const targetNode = network[signal.targetLayer].find(node => node.x === signal.targetX && node.y === signal.targetY);
            if (targetNode && targetNode.activation > maxActivation) {
                maxActivation = targetNode.activation;
            }
        });
        return maxActivation;
    }

    // Draw layer labels
    const labels = ['Input Layer', 'Hidden Layers', 'Output Layer'];
    labels.forEach((label, index) => {
        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', index === 0 ? 50 : (index === 1 ? svg.clientWidth / 2 : svg.clientWidth - 50));
        text.setAttribute('y', svg.clientHeight - 10);
        text.setAttribute('text-anchor', index === 0 ? 'start' : (index === 1 ? 'middle' : 'end'));
        text.setAttribute('fill', '#ffffff');
        text.textContent = label;
        svg.appendChild(text);
    });
}

function displayOutput() {
    const outputLayer = network[network.length - 1];
    const outputData = outputLayer.map((node, index) => ({
        layerNumber: network.length,
        layerCategory: index === 0 ? 'Output Layer' : 'Hidden Layer',
        nodeNumber: index + 1,
        nodeValue: node.activation.toFixed(2)
    }));
    const outputJson = JSON.stringify(outputData, null, 2);

    const outputField = document.getElementById('outputField');
    outputField.textContent = ''; // Clear previous output
    typeText(outputField, outputJson, 0);
}

function typeText(element, text, index) {
    if (index < text.length) {
        element.textContent += text.charAt(index);
        setTimeout(() => {
            typeText(element, text, index + 1);
            element.scrollTop = element.scrollHeight; 
        }, 50);
    } else {
        element.scrollTop = element.scrollHeight; 
    }
}

function updateSignals() {
    let cycleCompleted = false;
    
    signals.forEach(signal => {
        if (signal.active) {
            signal.progress += 0.01 * animationSpeed;
            if (signal.progress >= 1) {
                signal.progress = 0;
                signal.active = false;
                activateNextLayer(signal.targetX, signal.targetY, signal.targetLayer);
                
                // Check if this signal reached the output layer
                if (signal.targetLayer === network.length - 1) {
                    cycleCompleted = true;
                }
            }
        }
    });

    if (!signals.some(s => s.active)) {
        displayOutput();
        
        // If a cycle was pending and completed, increment the counter
        if (cyclePending && cycleCompleted) {
            cycleCounter++;
            updateCycleCounter(cycleCounter);
            cyclePending = false;
        }
        
        activateFirstLayer();
    }

    // Set cyclePending to true when starting a new cycle from the input layer
    if (signals.some(s => s.active && s.sourceLayer === 0) && !cyclePending) {
        cyclePending = true;
    }
}


function drawSignals() {
    signals.forEach(signal => {
        if (signal.active) {
            const x = signal.x + (signal.targetX - signal.x) * signal.progress;
            const y = signal.y + (signal.targetY - signal.y) * signal.progress;
            const circle = document.createElementNS(ns, 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '3');
            circle.setAttribute('fill', layerColors[signal.sourceLayer]);
            svg.appendChild(circle);
        }
    });
}

function activateFirstLayer() {
    signals.filter(s => s.sourceLayer === 0).forEach(s => s.active = true);
}

function activateNextLayer(x, y, layer) {
    const targetNode = network[layer].find(node => node.x === x && node.y === y);
    if (targetNode.activation < 1.00) {
        // Calculate the sum of activation values of all previous nodes
        let sumOfPreviousActivations = 0;
        for (let i = 0; i < layer; i++) {
            sumOfPreviousActivations += network[i].reduce((sum, node) => {
                if (node.activation < 1.00) {
                    return sum + node.activation;
                }
                return sum;
            }, 0);
        }

        // Adjust the increment based on the sum of previous activations
        const increment = sumOfPreviousActivations; // Adjust the base increment as needed
        targetNode.activation += increment;

        // Check if activation has reached the threshold
        if (targetNode.activation >= 1.00) {
            // Reset activation to 0.00
            targetNode.activation = 0.00;
            
            // Activate Signals: Sets the `active` property of corresponding signals to true
            signals.filter(s => s.x === x && s.y === y).forEach(s => s.active = true);
            
            // Update targetNode activation with a random value + previous activation
            network[layer].find(node => node.x === x && node.y === y).activation = Math.random() + targetNode.activation;
        }        
    }
}

function animate() {
    if (!isRunning) return;

    // Fetch node values from sidebar inputs every cycle
    updateNodeInputs();

    drawNetwork();
    updateSignals();
    drawSignals();
    
    animationFrame = requestAnimationFrame(animate);
}

// Function to update cycle counter display
function updateCycleCounter(count) {
    cycleCounterElement.textContent = count.toString();
}

function updateNodeInputs() {
    const inputNodes = document.querySelectorAll('#inputs input[type="number"]');
    inputNodes.forEach((input, index) => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            network[0][index].activation = Math.max(0, Math.min(1, value));
        }
    });

    // If simulation is running, update signals and redraw network
    if (isRunning) {
        updateSignals();
        drawNetwork();
    }
}

function toggleAnimation() {
    isRunning = !isRunning;
    const button = document.getElementById('toggleButton');
    if (isRunning) {
        button.textContent = 'Pause';
        button.style.color = '#1e1e1e';
        button.style.backgroundColor = '#f7b731';
        animate();
    } else {
        button.textContent = 'Continue';
        button.style.backgroundColor = '#4CAF50';
        cancelAnimationFrame(animationFrame);
    }
}

function resetSimulation() {
    isRunning = false;
    cancelAnimationFrame(animationFrame);
    document.getElementById('toggleButton').textContent = 'Run';
    document.getElementById('toggleButton').style.backgroundColor = '#4CAF50';
    network.forEach(layer => layer.forEach(node => node.activation = 0));
    signals.forEach(signal => {
        signal.active = false;
        signal.progress = 0;
    });
    drawNetwork();
    document.querySelectorAll('#inputs input').forEach(input => {
        input.value = Math.random();
        updateInputNode(input);
    });
    document.getElementById('outputField').textContent = '';

    // Reset cycle counter and pending flag
    cycleCounter = 0;
    cyclePending = false;
    updateCycleCounter(cycleCounter);
}

function createInputs() {
    const inputsContainer = document.getElementById('inputs');
    inputsContainer.innerHTML = '';

    network[0].forEach((node, index) => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = `Node ${index + 1}`;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = node.activation.toFixed(2);

        const deleteButton = document.createElement('button');
        const img = document.createElement('img');
        img.src = 'assets/delete_icon.png';  
        img.style.width = '24px';
        img.style.height = '24px'; 

        deleteButton.appendChild(img);
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => removeInputNode(index));

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        inputGroup.appendChild(deleteButton);

        inputsContainer.appendChild(inputGroup);
    });
}

function updateInputNode(input) {
    const index = Array.from(input.parentNode.parentNode.children).indexOf(input.parentNode);
    let value = parseFloat(input.value); // Parse float to handle decimal values
    if (!isNaN(value)) {
        network[0][index].activation = Math.max(0, Math.min(1, value));
        input.value = network[0][index].activation.toFixed(2);

        // If simulation is running, update signals immediately
        if (isRunning) {
            updateSignals();
            drawNetwork();
        }
    } else {
        alert('Please enter a valid number between 0 and 1.');
        input.value = network[0][index].activation.toFixed(2);
    }
}

function initializeInputs() {
    const inputsContainer = document.getElementById('inputs');
    inputsContainer.innerHTML = '';

    network[0].forEach((node, index) => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = `Node ${index + 1}`;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = node.activation.toFixed(2);
        input.addEventListener('input', () => updateInputNode(input));

        const deleteButton = document.createElement('button');
        const img = document.createElement('img');
        img.src = 'assets/delete_icon.png';  
        img.style.width = '24px';
        img.style.height = '24px'; 

        deleteButton.appendChild(img);
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => removeInputNode(index));

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        inputGroup.appendChild(deleteButton);

        inputsContainer.appendChild(inputGroup);
    });
}

function addInputNode() {
    if (network[0].length < 7) {
        const newNode = { x: network[0][0].x, y: 0, activation: 0 };
        network[0].push(newNode);

        // Recalculate y-positions for input layer nodes
        const svgHeight = svg.clientHeight;
        network[0].forEach((node, index) => {
            node.y = svgHeight * (index + 1) / (network[0].length + 1);
        });

        initializeSignals();
        createInputs();
        drawNetwork();
    } else {
        alert("Maximum number of input nodes reached.");
    }
}

function removeInputNode(index) {
    if (network[0].length > 1) {
        network[0].splice(index, 1);

        // Recalculate y-positions for input layer nodes
        const svgHeight = svg.clientHeight;
        network[0].forEach((node, index) => {
            node.y = svgHeight * (index + 1) / (network[0].length + 1);
        });

        initializeSignals();
        createInputs();
        drawNetwork();
    } else {
        alert("Cannot delete the last input node.");
    }
}

function refreshNetwork() {
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    let x = 100;
    const layerSpacing = (svgWidth - 200) / (network.length - 1);

    // Update existing layers with new positions based on current SVG dimensions
    network.forEach((layer, i) => {
        let y = svgHeight / (layer.length + 1);
        layer.forEach((node, j) => {
            node.x = x;
            node.y = y * (j + 1);
        });
        x += layerSpacing;
    });

    initializeSignals(); // Reinitialize signals based on updated network structure
    createInputs(); // Recreate input nodes based on updated network structure
    drawNetwork(); // Redraw the entire network based on updated positions and activations
}

// Resize event listener to handle window resizing
window.addEventListener('resize', () => {
    refreshNetwork();
});

document.getElementById('speed').addEventListener('input', (e) => {
    animationSpeed = parseInt(e.target.value);
});

document.getElementById('toggleButton').addEventListener('click', toggleAnimation);
document.getElementById('resetButton').addEventListener('click', resetSimulation);
document.getElementById('addNode').addEventListener('click', addInputNode);

document.getElementById('toggleSidebar').addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.marginLeft = sidebar.style.marginLeft === '-250px' ? '0' : '-300px';
});

document.getElementById('showSidebar').addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.marginLeft = '0';
    document.getElementById('showSidebar').style.display = 'none';
});

document.querySelectorAll('.sidebar, .main-content').forEach(el => {
    el.addEventListener('transitionend', () => {
        if (document.querySelector('.sidebar').style.marginLeft === '-300px') {
            document.getElementById('showSidebar').style.display = 'block';
        } else {
            document.getElementById('showSidebar').style.display = 'none';
        }
        refreshNetwork();
    });
});

initializeNetwork();
