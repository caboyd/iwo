/*
File Format:
http://paulbourke.net/dataformats/pic/

Sample Code:
http://radsite.lbl.gov/radiance/refer/Notes/picture_format.html
https://github.com/enkimute/hdrpng.js/blob/master/hdrpng.js
 */

import { FileLoader } from "./FileLoader";

const COLRFMT = "32-bit_rle_rgbe";
const FMT = "FORMAT";
const EXPOSURE = "EXPOSURE";

const XDECR = 1;
const YDECR = 2;
const YMAJOR = 4;

interface Resolution {
    x:number;
    y:number;
    orientation:number;
}

export interface  HDRBuffer {
    data:ArrayBufferView;
    width:number;
    height:number;
}

export class HDRImageLoader extends FileLoader {
    static promise(
        file_name: string,
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    ): Promise<HDRBuffer> {
        return new Promise<HDRBuffer>(resolve => {
            super.promise(file_name, base_url).then((response:Response) => {
                response.arrayBuffer().then( (data:ArrayBuffer) => {
                    let image_data = HDRImageLoader.fromArrayBuffer(data);
                    
                    resolve(image_data);
                })
            });
        });
    }

    static fromArrayBuffer(data:ArrayBuffer):HDRBuffer{
        let buffer = new Uint8Array(data);
        let header:Map<string,string|undefined> = getHeader(buffer);

        if(!header.has('#?RADIANCE') && !header.has('#?RGBE'))
            throw "Invalid HDR Image";

        let good_format = header.get(FMT) === COLRFMT;
        if(!good_format)
            throw "Invalid HDR Image FORMAT";

        let exposure = header.get(EXPOSURE);
        
        let max_y = parseInt( header.get("Y")!);
        let max_x = parseInt(header.get("X")!);

        let image = new Uint8Array(max_x * max_y * 4);
        let image_index = 0;
        
        let buffer_index = parseInt(header.get("HEADER_END")!);

        for( let j = 0; j < max_y; j++) {
            let rgbe = buffer.slice(buffer_index, buffer_index += 4);
            let scanline = [];

            if ((rgbe[0] != 2) || (rgbe[1] != 2) || (rgbe[2] & 0x80)) throw ('HDR parse error ..');
            if ((rgbe[2] << 8) + rgbe[3] != max_x) throw('HDR line mismatch ..');
            
            for (let i = 0; i < 4; i++) {
                let ptr = i * max_x, ptr_end = (i + 1) * max_x, buf, count;
                while (ptr < ptr_end) {
                    buf = buffer.slice(buffer_index, buffer_index += 2);
                    if (buf[0] > 128) {
                        count = buf[0] - 128;
                        while (count-- > 0) scanline[ptr++] = buf[1];
                    }
                    else {
                        count = buf[0] - 1;
                        scanline[ptr++] = buf[1];
                        while (count-- > 0) scanline[ptr++] = buffer[buffer_index++];
                    }
                }
            }
            for (let i = 0; i < max_x; i++) {
                image[image_index++] = scanline[i];
                image[image_index++] = scanline[i + max_x];
                image[image_index++] = scanline[i + 2 * max_x];
                image[image_index++] = scanline[i + 3 * max_x];
            }
        }
        let float_buffer = rgbeToFloat(image);
        
        return {data:float_buffer,height:max_y,width:max_x} as HDRBuffer;
    }


    // static promiseAll(
    //     files: string[],
    //     base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    // ): Promise<HTMLImageElement[]> {
    //     let imgs = Array.from({ length: files.length }, u => new Image());
    //     let promises: Promise<HTMLImageElement>[] = [];
    //
    //     return super.promiseAll(files, base_url).then((data: Blob[]) => {
    //         for (let i = 0; i < data.length; i++) {
    //             let img = imgs[i];
    //             let promise = new Promise<HTMLImageElement>(function(resolve) {
    //                 img.src = URL.createObjectURL(data[i]);
    //                 img.onload = () => resolve(img);
    //             });
    //             promises.push(promise);
    //         }
    //         return Promise.all(promises).then(images => {
    //             return images;
    //         });
    //     });
    // }
    //
    // static load(file_name: string, base_url: string = ""): HTMLImageElement {
    //     let img = new Image();
    //     super.promise(file_name, base_url).then(data => {
    //         img.src = URL.createObjectURL(data);
    //     });
    //     // super.onAllComplete(1);
    //     return img;
    // }
}


function rgbeToFloat(buffer: Uint8Array): ArrayBufferView {
    let l = buffer.byteLength >> 2;
    let result = new Float32Array(l * 3);
    for (let i = 0; i < l; i++) {
        let s = Math.pow(2, buffer[i * 4 + 3] - (128 + 8));
        result[i * 3] = buffer[i * 4] * s;
        result[i * 3 + 1] = buffer[i * 4 + 1] * s;
        result[i * 3 + 2] = buffer[i * 4 + 2] * s;
    }
    return result;
}

//
function getHeader(buffer:Uint8Array):Map<string,string|undefined>{
    let header = new Map();
    //Grabs all lines until first empty line
    let s = '';
    let index = 0;

    //Grabs text until the after the resolution line
    while (!s.match(/\n\n[^\n]+\n/g)) s += String.fromCharCode(buffer[index++]);

    let lines = s.split(/\n/);

    for(let line of lines){
        if(!line) continue;

        // Grabs the Resolution line
        // This line is of the form "{+-}{XY} xyres {+-}{YX} yxres\n".
        if(line.match(/[+-][XY] \d+ [+-][YX] \d+/)){
            let res = getResolution(line);
            header.set('X', res.x);
            header.set('Y', res.y);
            continue;
        }
        
        let key_value = line.split('=');
        header.set(key_value[0],key_value[1] ? key_value[1]:undefined);
    }
    
    header.set("HEADER_END", index);
    return header;
}


function getResolution(line:string):Resolution{
    let values = line.split(' ');
    let y_index = line.indexOf('Y');
    let x_index = line.indexOf('X');

    let res:Resolution = {x:0,y:0,orientation:0};

    if(x_index > y_index) res.orientation |= YMAJOR;
    if(line[x_index-1] == '-') res.orientation |= XDECR;
    if(line[y_index-1] == '-') res.orientation |= YDECR;

    if(x_index > y_index){
        res.y = parseInt(values[1]);
        res.x = parseInt(values[3]);
    }else{
        res.x = parseInt(values[1]);
        res.y = parseInt(values[3]);
    }

    if(res.x <= 0 || res.y <= 0)
        throw "Invalid HDR Image Resolution in File";

    //Swap x and y if not Y major
    if(res.orientation & YMAJOR){
    }else
        [res.x,res.y] = [res.y,res.x];

    return res;
}