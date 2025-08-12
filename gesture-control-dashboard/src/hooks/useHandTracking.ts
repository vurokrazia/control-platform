import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { MovementDetector } from '../utils/movementDetection';
import type { Movement, Point } from '../utils/movementDetection';

export interface HandTrackingState {
  isLoaded: boolean;
  isTracking: boolean;
  error: string | null;
  indexFingerPosition: Point | null;
  currentMovement: Movement | null;
  dominantDirection: Movement['direction'];
}

export const useHandTracking = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const movementDetectorRef = useRef(new MovementDetector());

  const [state, setState] = useState<HandTrackingState>({
    isLoaded: false,
    isTracking: false,
    error: null,
    indexFingerPosition: null,
    currentMovement: null,
    dominantDirection: 'none'
  });

  const onResults = useCallback((results: Results) => {
    console.log('onResults llamado, manos detectadas:', results.multiHandLandmarks?.length || 0);
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas no disponible');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Contexto 2D no disponible');
      return;
    }

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      console.log('Mano detectada, procesando...');
      const landmarks = results.multiHandLandmarks[0];
      
      // El índice es el landmark #8 (punta del dedo índice)
      const indexFinger = landmarks[8];
      
      if (indexFinger) {
        console.log('Dedo índice detectado:', indexFinger);
        
        const position: Point = {
          x: indexFinger.x,
          y: indexFinger.y
        };

        // Detectar movimiento
        const movement = movementDetectorRef.current.detectMovement(position);
        const dominantDirection = movementDetectorRef.current.getDominantDirection();

        // Dibujar punto del dedo índice
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(
          position.x * canvas.width,
          position.y * canvas.height,
          10,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // Dibujar líneas de conexión de la mano
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Dibujar conexiones básicas de la mano
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
          [0, 5], [5, 6], [6, 7], [7, 8], // Índice
          [0, 17], [5, 9], [9, 10], [10, 11], [11, 12], // Medio
          [9, 13], [13, 14], [14, 15], [15, 16], // Anular
          [13, 17], [17, 18], [18, 19], [19, 20] // Meñique
        ];

        connections.forEach(([start, end]) => {
          const startPoint = landmarks[start];
          const endPoint = landmarks[end];
          
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        });
        
        ctx.stroke();

        // Actualizar estado
        setState(prev => ({
          ...prev,
          indexFingerPosition: position,
          currentMovement: movement,
          dominantDirection
        }));
      }
    } else {
      console.log('No se detectó mano');
      // No se detectó mano
      setState(prev => ({
        ...prev,
        indexFingerPosition: null,
        currentMovement: null
      }));
    }
  }, []);

  const initializeHandTracking = useCallback(async () => {
    try {
      console.log('Inicializando MediaPipe Hands...');
      
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      console.log('Configurando opciones...');
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      console.log('Configurando callback onResults...');
      hands.onResults(onResults);
      handsRef.current = hands;

      // Esperar un poco para que MediaPipe se inicialice completamente
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('MediaPipe Hands inicializado correctamente');
      setState(prev => ({ ...prev, isLoaded: true }));
    } catch (error) {
      console.error('Error inicializando MediaPipe:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error inicializando MediaPipe'
      }));
    }
  }, [onResults]);

  const startTracking = useCallback(async () => {
    if (!videoRef.current || !handsRef.current) return;

    try {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      await camera.start();
      cameraRef.current = camera;

      setState(prev => ({ ...prev, isTracking: true, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error iniciando cámara'
      }));
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    movementDetectorRef.current.reset();
    
    setState(prev => ({ 
      ...prev, 
      isTracking: false,
      indexFingerPosition: null,
      currentMovement: null,
      dominantDirection: 'none'
    }));
  }, []);

  useEffect(() => {
    initializeHandTracking();

    return () => {
      stopTracking();
    };
  }, [initializeHandTracking, stopTracking]);

  return {
    videoRef,
    canvasRef,
    ...state,
    startTracking,
    stopTracking
  };
};