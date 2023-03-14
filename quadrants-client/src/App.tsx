import React, { useEffect, useState, useRef, useCallback } from 'react';
import Axios from 'axios';
import './App.css';
import ausTemplate from './aus.png';
import kisTemplate from './kis.png';
import matTemplate from './mat.png';
import morTemplate from './mor.png';

const pairingTypes = {
  aus: {
    name: "Auspisticism",
    image: ausTemplate,
    width: 284,
    height: 284,
    inputs: [{
      name: "Left",
      x: 34,
      y: 127,
      width: 86,
      height: 86,
    }, {
      name: "Right",
      x: 167,
      y: 127,
      width: 86,
      height: 86,
    }, {
      name: "Facilitator",
      x: 101,
      y: 12,
      width: 86,
      height: 86,
    }],
  },
  kis: {
    name: "Kismesissitude",
    image: kisTemplate,
    width: 315,
    height: 376,
    inputs: [{
      name: "Left",
      x: 18,
      y: 180,
      width: 111,
      height: 111,
    }, {
      name: "Right",
      x: 184,
      y: 180,
      width: 111,
      height: 111,
    }],
  },
  mat: {
    name: "Matespritship",
    image: matTemplate,
    width: 354,
    height: 377,
    inputs: [{
      name: "Left",
      x: 27,
      y: 21,
      width: 109,
      height: 109,
    }, {
      name: "Right",
      x: 215,
      y: 21,
      width: 109,
      height: 109,
    }],
  },
  mor: {
    name: "Moirallegiance",
    image: morTemplate,
    width: 344,
    height: 386,
    inputs: [{
      name: "Left",
      x: 40,
      y: 133,
      width: 118,
      height: 118,
    }, {
      name: "Right",
      x: 189,
      y: 133,
      width: 118,
      height: 118,
    }],
  },
};

type KeyValuePairs<T> = { [K in keyof T]: [K, T[K]] }[keyof T];
type PairingSelection = KeyValuePairs<typeof pairingTypes>;

const getAvatarUrl = async (id: string) => {
  const { data } = await Axios.get('/api/avatar', {
    params: { id },
    responseType: 'json',
  });

  return data.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
};

type SelectionMode = { type: 'discord', id?: string } | { type: 'file', file?: File };

const ImageSelection = ({ index, label, setImage }: { index: number, label: string, setImage: (index: number, image: HTMLImageElement) => void }) => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>({ type: 'file' });

  useEffect(() => {
    const image = new Image();
    image.onload = () => setImage(index, image);

    if (selectionMode.type === 'discord' && selectionMode.id) {
      getAvatarUrl(selectionMode.id).then((url) => image.src = url);
    } else if (selectionMode.type === 'file' && selectionMode.file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          image.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(selectionMode.file);     
    }
  }, [index, selectionMode, setImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectionMode({ type: 'file', file: event.target.files[0] });
    }
  };

  const modeSelection = <span>
    <label><input type='radio' value='file' checked={selectionMode.type === 'file'} onChange={(event) => setSelectionMode({ type: event.target.value as 'file' | 'discord' })} /> File</label>&nbsp;
    <label><input type='radio' value='discord' checked={selectionMode.type === 'discord'} onChange={(event) => setSelectionMode({ type: event.target.value as 'file' | 'discord' })} /> Discord ID</label>
  </span>

  if (selectionMode.type === 'discord') {
    return <label style={{display: 'block'}}>
      <span style={{ fontWeight: 'bold' }}>{label}</span>: {modeSelection} <input type='text' onChange={(event) => setSelectionMode({ type: 'discord', id: event.target.value })} value={selectionMode.id || ''} />
    </label>
  }

  return <label style={{display: 'block'}}>
    <span style={{ fontWeight: 'bold' }}>{label}</span>: {modeSelection} <input type='file' onChange={handleFileChange} value={''} />
  </label>;
};

const App = () => {
  const [pairingType, setPairingType] = useState<PairingSelection>(['aus', pairingTypes['aus']]);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef && canvasRef.current) {
      const [, config] = pairingType;

      if (canvasRef.current.width !== config.width || canvasRef.current.height !== config.height) {
        canvasRef.current.width = config.width;
        canvasRef.current.height = config.height;
      }

      const context = canvasRef.current.getContext('2d')!;
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      Promise.all(config.inputs.map((input, inputIndex) => {
        const image = images[inputIndex] || null;

        if (image) {
          return [input.x, input.y, input.width, input.height, image] as [number, number, number, number, HTMLImageElement];
        }

        return null;
      })).then((images) => {
        images.forEach((imageData) => {
          if (imageData) {
            const [x, y, width, height, image] = imageData;
            context.drawImage(image, x, y, width, height);
          }
        });

        const templateImage = new Image();
        templateImage.src = config.image;
        templateImage.onload = () => context.drawImage(templateImage, 0, 0);
      });
    }
  }, [pairingType, images, canvasRef]);

  const updateType = (type: string) => {
    if (type in pairingTypes && type !== pairingType[0]) {
      const typedType = type as keyof typeof pairingTypes;
      setPairingType([typedType, pairingTypes[typedType]]);
      setImages([]);
    }
  };

  const changeImage = useCallback((index: number, image: HTMLImageElement) => {
    setImages((previousImages) => {
      const copy = [...previousImages];
      copy[index] = image;
      return copy;
    });
  }, [setImages]);

  return <div id="container"><div id="content">
    <div id="title">Current user: Ship Discord users.</div>
    <canvas id="canvas" ref={canvasRef} />
    <div id="form-content">
      <label style={{display: 'block'}}>
        Quadrant:&nbsp;
        <select onChange={(event) => updateType(event.target.value)}>
          {Object.entries(pairingTypes).map(([key, entry]) => {
            return <option key={key} value={key}>{entry.name}</option>
          })}
        </select>
      </label>
      {pairingType[1].inputs.map((input, inputIndex) => <ImageSelection key={`${inputIndex}`} index={inputIndex} label={input.name} setImage={changeImage} />)}
    </div>
    <div id="text-content">To use Discord IDs as an input, you must be able access the Discord IDs of users you wish to ship. To enable this, go to your Discord settings, select Advanced, and check "Developer Mode". You will now be able to right click on users and select "Copy ID" to get their Discord ID.</div>
  </div></div>;
};

export default App;
