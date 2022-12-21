class CoreData {
  rows = [];
  bankLink = [];
}

class CoreDataManager {
  coreList = [];
  currentCore = null;
  MAX_ROW_COUNT = 1000;
  MAX_BANK_ADDR = 512;
  offset = 0;
  bankCount = 1;
  bankId = 1;
  constructor(offset = 0, bankCount = 0) {
    this.offset = offset;
    this.bankCount = bankCount;
    this.currentCore = new CoreData();
    this.currentCore.bankLink.push(this.bankId);
  }
  static getNewCore() {
    return {
      rows: [],
      linkBank: null,
    };
  }
  packCore() {
    this.coreList.push(this.currentCore);
    this.currentCore = new CoreData();
    this.currentCore.bankLink.push(this.bankId);
    this.bankCount = 1;
  }
  pushPixel(color) {
    const code = `write ${color} bank${this.bankCount} ${this.offset}`;
    this.currentCore.rows.push(code);
    this.offset++;
    if (this.offset >= this.MAX_BANK_ADDR) {
      this.bankCount++;
      this.bankId++;
      this.currentCore.bankLink.push(this.bankId);
      this.offset = 0;
    }
    if (this.currentCore.rows.length >= this.MAX_ROW_COUNT) {
      this.packCore();
    }
  }
  endPush() {
    this.packCore();
  }
}

function rgbToHex(rgb) {
  let num = 0;
  rgb.forEach((item) => {
    num = num * 256 + item;
  });
  const str = num.toString(16).padStart(8, "0");
  return str;
}

function transferImageData(image, offset = 0, bankCount = 1) {
  const canvas = document.getElementById("canvas");
  // const canvas = document.createElement("canvas");
  const { width, height } = image;
  canvas.width = width;
  canvas.height = height;
  console.log(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height).data;
  const length = width * height;
  const coreDataManager = new CoreDataManager(offset, bankCount);
  for (let i = 0; i < length; i++) {
    const index = i * 4;
    const color = imageData.slice(index, index + 4);
    console.log(color);
    const colorHex = "%" + rgbToHex(color);
    coreDataManager.pushPixel(colorHex);
  }
  coreDataManager.endPush();
  return coreDataManager;
}

function copyCode(index) {
  const core = coreDataManager.coreList[index];
  const code = core.rows.join("\n");
  codeText.value = code;
  codeText.select();
  document.execCommand("copy");
}

function renderCopyButtons() {
  buttons.innerHTML = "";
  const { coreList } = coreDataManager;
  const div = document.createElement("div");
  div.innerText = `共${coreList.length}个处理器，${coreDataManager.bankId}个bank`;
  buttons.appendChild(div);
  coreList.forEach((core, index) => {
    const button = document.createElement("button");
    button.innerText = `处理器${index} 连接bank ${core.bankLink.join(",")}`;
    button.className = "copy-button";
    buttons.appendChild(button);
    const onClick = () => {
      button.className = "copy-button copyed";
      copyCode(index);
    };
    button.addEventListener("click", onClick);
  });
}

const fileInput = document.getElementById("fileInput");
const offsetInput = document.getElementById("offsetInput");
const codeText = document.getElementById("codeText");

const buttons = document.getElementById("buttons");
let coreDataManager = null;
fileInput.addEventListener("change", (e) => {
  codeText.value = "";
  const imageFile = e.target.files[0];
  fileInput.value = null;
  const fileReader = new FileReader();
  fileReader.readAsDataURL(imageFile);
  fileReader.addEventListener("load", (e) => {
    const image = new Image();
    image.src = e.target.result;
    image.addEventListener("load", (e) => {
      const offset = new Number(offsetInput.value);
      coreDataManager = transferImageData(image, offset);
      console.log(coreDataManager);
      renderCopyButtons();
    });
  });
});
