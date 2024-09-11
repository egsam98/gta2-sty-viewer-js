import { carIntNames, carType } from "./constants.js";

export function saveJSON(sty, sprite, filename) {
    console.log(sty);

    const obj = {
        cars: {},
        peds: {},
    }
    obj.peds = Object.fromEntries(sty.data.sprites.ped.map(ped => [ped.relID, ped]));
    obj.cars = Object.fromEntries(sty.data.sprites.car.map(sprite => {
        const meta = { ...sty.data.cars.find(car => car.sprite.relID == sprite.relID) };
        meta.engine = carType[meta.name] || "STANDARD";
        meta.bitmap = sprite.bitmap;
        meta.deltas = sprite.deltas.map(delta => delta.map(dt => ({ offset: dt.offset, data: Array.from(dt.data) })));
        const name = carIntNames[meta.model];

        switch (name) {
            case "ISETTA":
                meta.paletteIds = [189];
                break
            case "ISETLIMO":
                meta.paletteIds = [189];
                break
            case "BUICK":
                meta.paletteIds = [195];
                break
            case "STRATOS":
                meta.paletteIds = [177];
                break
            case "STRATOSB":
                meta.paletteIds = [177];
                break
            case "VTYPE":
                meta.paletteIds = [169];
                break
            case "PICKUP":
                meta.paletteIds = [170];
                break
            case "MIURA":
                meta.paletteIds = [182];
                break
            case "KRSNABUS":
                meta.paletteIds = [33];
                break
            default:
                meta.paletteIds = [sprite.bitmap.virtualPalette.physicalPalette.relID - 1].concat(meta.remaps.map(r => r.physicalPalette.id - 1));
        }

        return [name, meta]
    }))

    // Collect wrecks
    obj.wrecks = Object.entries(obj.cars)
        .filter(([name, _]) => name.startsWith("WRECK"))
        .map(([name, car]) => {
            delete obj.cars[name];
            return { index: parseInt(name.slice(-1)), width: car.width, height: car.height }
        })
        .sort((l, r) => l.index < r.index);

    for (const key in obj.cars) {
        delete obj.cars[key].sprite;
        delete obj.cars[key].remaps;
        // delete obj.cars[key].bitmap.virtualPalette;
    }

    const file = new Blob([JSON.stringify(obj)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = "models.json";
    a.click();
}

export function saveBMP(sprite, palette) {
    const bitmap = sprite.bitmap;
    const headersLength = 14 + 40;
    const pixelDataLength = bitmap.data.length;
    const paletteLength = palette.data.length;
    // const paletteLength = bitmap.virtualPalette.physicalPalette.data.length;
    const fileSize = headersLength + pixelDataLength + paletteLength;

    const header = new Uint8Array([
        0x42, 0x4D, // BM
        ...new Uint8Array((new Uint32Array([fileSize])).buffer), // file size
        0x00, 0x00, 0x00, 0x00, // reserved
        ...new Uint8Array((new Uint32Array([headersLength + paletteLength])).buffer), // pixelData data offset
        0x28, 0x00, 0x00, 0x00, // DIB header size
        ...new Uint8Array((new Uint32Array([bitmap.width])).buffer), // Width
        ...new Uint8Array((new Uint32Array([bitmap.height])).buffer), // Height
        0x01, 0x00, // planes
        0x08, 0x00, // bits per pixel
        0x00, 0x00, 0x00, 0x00, // compression
        0x00, 0x00, 0x00, 0x00, // image size (0 for uncompressed)
        0x00, 0x00, 0x00, 0x00, // x pixels per meter
        0x00, 0x00, 0x00, 0x00, // y pixels per meter
        0x00, 0x01, 0x00, 0x00, // colors in color table (256)
        0x00, 0x00, 0x00, 0x00, // important color count (256)
    ]);

    

    let palette_rgb = [];
    for (let i = 0; i < palette.data.length; i += 4) {
        palette_rgb.push(palette.data.slice(i, i + 4));
    }

    let pxData = [];
    for (let i = 0; i < bitmap.data.length; i++) {
        const byte = bitmap.data[i];
        // if (byte == 0) {
        //     continue;
        // }
        const px = palette_rgb[byte];
        pxData.push(
            px[0], 
            px[1], 
            px[2], 
            px[3],
        );
    }
    const file = new Blob([new Uint8Array(pxData)], {type: 'image/png'});

    // const lineMargin = new Array(3 - ((bitmap.width+3) % 4)).fill(0);
    // let pixelLines = [];
    // for(let y = bitmap.height-1; y >= 0; y--) {
    //     let line = [];
    //     line = bitmap.data.slice(y*bitmap.width, (y+1)*bitmap.width);
    //     pixelLines.push(...line, ...lineMargin);
    // }
    // const pixelData = new Uint8Array(pixelLines);
    // const file = new Blob([header, new Uint8Array(palette.getBGRAData()), new Uint8Array(png)], {type: 'image/png'});

    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = `sprite_${sprite.base}_${sprite.relID}.png`;
    a.click();
}
