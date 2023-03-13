import React, { useEffect, useState, useRef } from 'react';
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
      name: "Left Discord ID",
      x: 34,
      y: 127,
      width: 86,
      height: 86,
    }, {
      name: "Right Discord ID",
      x: 167,
      y: 127,
      width: 86,
      height: 86,
    }, {
      name: "Facilitator Discord ID",
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
      name: "Left Discord ID",
      x: 18,
      y: 180,
      width: 111,
      height: 111,
    }, {
      name: "Right Discord ID",
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
      name: "Left Discord ID",
      x: 27,
      y: 21,
      width: 109,
      height: 109,
    }, {
      name: "Right Discord ID",
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
      name: "Left Discord ID",
      x: 40,
      y: 133,
      width: 118,
      height: 118,
    }, {
      name: "Right Discord ID",
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
  // return 'https://cdn.discordapp.com/embed/avatars/0.png';
  const { data } = await Axios.get('/api/avatar', {
    params: { id },
    responseType: 'json',
  });

  return data.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
};

const App = () => {
  const [pairingType, setPairingType] = useState<PairingSelection>(['aus', pairingTypes['aus']]);
  const [discordIds, setDiscordIds] = useState<string[]>([]);
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
        return new Promise<[number, number, number, number, HTMLImageElement]>(async (resolve) => {
          const image = new Image();
          image.src = await getAvatarUrl(discordIds[inputIndex] || '0');

          image.onload = () => resolve([input.x, input.y, input.width, input.height, image]);
        });
      })).then((images) => {
        images.forEach(([x, y, width, height, image]) => {
          context.drawImage(image, x, y, width, height);
        });

        const templateImage = new Image();
        templateImage.src = config.image;
        templateImage.onload = () => context.drawImage(templateImage, 0, 0);
      });
    }
  }, [pairingType, discordIds, canvasRef]);

  const updateType = (type: string) => {
    if (type in pairingTypes && type !== pairingType[0]) {
      const typedType = type as keyof typeof pairingTypes;
      setPairingType([typedType, pairingTypes[typedType]]);
      setDiscordIds([]);
    }
  };

  const changeDiscordId = (id: string, index: number) => {
    setDiscordIds((previousIds) => {
      const copy = [...previousIds];
      copy[index] = id;
      return copy;
    });
  };

  // <img src={logo} className="App-logo" alt="logo" />
  return <div id="container"><div id="content">
    <div id="title">Current user: Ship Discord users.</div>
    <canvas id="canvas" ref={canvasRef} />
    <div id="form-content">
      <label style={{display: 'block'}}>
        Quadrant:&nbsp;
        <select onChange={(event) => updateType(event.target.value)}>
          {Object.entries(pairingTypes).map(([key, entry]) => {
            return <option value={key}>{entry.name}</option>
          })}
        </select>
      </label>
      {pairingType[1].inputs.map((input, inputIndex) => <label style={{display: 'block'}}>{input.name}: <input type='text' onChange={(event) => changeDiscordId(event.target.value, inputIndex)} value={discordIds[inputIndex] || ''} /></label>)}
    </div>
    <div id="text-content">To use this website, you must be able access the Discord IDs of users you wish to ship. To enable this, go to your Discord settings, select Advanced, and check "Developer Mode". You will now be able to right click on users and select "Copy ID" to get their Discord ID.</div>
  </div></div>;
};

export default App;
