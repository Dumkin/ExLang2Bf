var buttonConvert = document.querySelector("#convert").onclick = function () {
  var src = document.querySelector("#src").value;
  var bf = convert(src);
  document.querySelector("#bf").value = bf;
}
function convert(src) {
  var lines = src.split("\n");
  var result = "";

  var variables = {};
  var memory = {};
  var currentMemoryPointer = 0;

  var getMemoryFreeIndex = () => {
    const length = Object.keys(memory).length;
    for (let i = 0; i < length; i++) {
      if (!(i in memory)) {
        return i;
      }
    }
    return length;
  }
  var getMemoryFromIndex = (to) => {
    for (let i = 0; i < Math.abs(currentMemoryPointer - to); i++) {
      if (currentMemoryPointer - to < 0) {
        result += ">";
      } else {
        result += "<";
      }
    }
    currentMemoryPointer = to;
  }
  var createVar = (key, value) => {
    switch (typeof value) {
      case "number":
        createVar_Int8(key, value);
        break;
      case "string":
        createVar_String(key, value);
        break;
      default:
        throw `unsupported type (${value})`;
    }
  }
  var createVar_Int8 = (name, value) => {
    if (!Number.isInteger(value)) {
      throw `variable int8 is not a integer - name: ${name}, value: ${value}`;
    }

    const valueNormalized = value % 256;
    const memoryIndex = getMemoryFreeIndex();

    variables[name] = {
      memoryIndex: memoryIndex,
      type: "int8"
    };
    memory[memoryIndex] = valueNormalized;

    getMemoryFromIndex(memoryIndex);
    writeMemoryOptimized(valueNormalized);
  }
  var createVar_String = (key, value) => {
    if (typeof value !== "string") {
      throw `variable ${name} is not string (${value})`;
    }

    var memoryIndexes = [];
    for (let i = 0; i < value.length; i++) {
      const memoryIndex = getMemoryFreeIndex();
      memoryIndexes.push(memoryIndex);
      memory[memoryIndex] = value.charCodeAt(i);
    }

    variables[key] = {
      memoryIndex: memoryIndexes,
      type: "string"
    };

    for (let i = 0; i < value.length; i++) {
      getMemoryFromIndex(memoryIndexes[i]);
      writeMemoryOptimized(value.charCodeAt(i));
    }
  }
  var writeMemoryOptimized = (value) => {
    var quotient = Math.floor(value / 10);
    var remainder = value % 10;

    const slotBefore = currentMemoryPointer;
    const slot = getMemoryFreeIndex();
    getMemoryFromIndex(slot);
    for (let i = 0; i < quotient; i++) {
      result += "+"
    }
    result += "["
    result += "-"
    getMemoryFromIndex(slotBefore);
    for (let i = 0; i < 10; i++) {
      result += "+"
    }
    getMemoryFromIndex(slot);
    result += "]"
    getMemoryFromIndex(slotBefore);
    for (let i = 0; i < remainder; i++) {
      result += "+"
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line == "" || (line[0] == "/" && line[1] == "/")) {
      continue;
    }
    const operators = line.split(" ");

    if (operators.length < 1) {
      return `Error: missing operator in ${i + 1} line.`;
    }

    switch (operators[0]) {
      case "var":
        if (operators.length == 2) {
          createVar(operators[1], 0)
        } else if (operators.length == 3) {
          if (!isNaN(operators[2])) {
            operators[2] = Number(operators[2]);
          }
          console.log(`var ${operators[2]} is ${typeof operators[2]} type`);
          createVar(operators[1], operators[2])
        } else {
          return `Error: wrong number of parameters in ${operators[0]} operator in ${i + 1} line.`;
        }
        break;
      case "add":
        if (operators.length == 3) {
          const variable = variables[operators[1]];
          const variableAdd = variables[operators[2]];

          if (variable.type != variableAdd.type) {
            return `Error: different types on ${i + 1} line.`;
          }

          const variableTemp = `translator_temp_line_${i + 1}`;
          createVar(variableTemp, memory[variableAdd.memoryIndex])

          memory[variable.memoryIndex] += memory[variableAdd.memoryIndex];

          var indexSlot = variables[variableTemp].memoryIndex;
          getMemoryFromIndex(indexSlot);
          result += "[";
          result += "-";
          getMemoryFromIndex(variable.memoryIndex);
          result += "+";
          getMemoryFromIndex(indexSlot);
          result += "]";
          delete variables[variableTemp];
        }
        break;
      case "out":
        if (operators.length == 2) {
          const variable = operators[1];

          if (variables[variable].type == "number") {
            getMemoryFromIndex(variables[variable].memoryIndex);
            result += ".";
          } else if (variables[variable].type == "string") {
            for (let i = 0; i < variables[variable].memoryIndex.length; i++) {
              const e = variables[variable].memoryIndex[i];
              getMemoryFromIndex(e);
              result += ".";
            }
          }
        }
        break;

      default:
        return `Error: undefined ${operators[0]} operator in ${i + 1} line.`;
    }
  }
  return result;
}