export interface Point {
	x: number;
	y: number;
  }
  
  export interface Movement {
	direction: 'up' | 'down' | 'left' | 'right' | 'none';
	magnitude: number;
	timestamp: number;
  }
  
  export class MovementDetector {
	private previousPosition: Point | null = null;
	private movementHistory: Movement[] = [];
	private readonly threshold = 0.02; // Umbral mínimo para detectar movimiento
	private readonly maxHistory = 10;
  
	detectMovement(currentPosition: Point): Movement {
	  const timestamp = Date.now();
	  
	  if (!this.previousPosition) {
		this.previousPosition = currentPosition;
		return {
		  direction: 'none',
		  magnitude: 0,
		  timestamp
		};
	  }
  
	  const deltaX = currentPosition.x - this.previousPosition.x;
	  const deltaY = currentPosition.y - this.previousPosition.y;
	  const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
	  let direction: Movement['direction'] = 'none';
  
	  if (magnitude > this.threshold) {
		// Determinar dirección basada en el mayor componente
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
		  // Invertir la dirección horizontal para compensar el efecto espejo
		  direction = deltaX > 0 ? 'left' : 'right';
		} else {
		  direction = deltaY > 0 ? 'down' : 'up';
		}
	  }
  
	  const movement: Movement = {
		direction,
		magnitude,
		timestamp
	  };
  
	  // Actualizar historial
	  this.movementHistory.push(movement);
	  if (this.movementHistory.length > this.maxHistory) {
		this.movementHistory.shift();
	  }
  
	  this.previousPosition = currentPosition;
	  return movement;
	}
  
	getMovementHistory(): Movement[] {
	  return [...this.movementHistory];
	}
  
	reset(): void {
	  this.previousPosition = null;
	  this.movementHistory = [];
	}
  
	// Obtener dirección dominante en los últimos movimientos
	getDominantDirection(): Movement['direction'] {
	  const recentMovements = this.movementHistory.slice(-5);
	  const directions = recentMovements
		.filter(m => m.direction !== 'none')
		.map(m => m.direction);
  
	  if (directions.length === 0) return 'none';
  
	  // Contar frecuencia de cada dirección
	  const counts = directions.reduce((acc, dir) => {
		acc[dir] = (acc[dir] || 0) + 1;
		return acc;
	  }, {} as Record<string, number>);
  
	  // Devolver la dirección más frecuente
	  return Object.entries(counts).reduce((a, b) => 
		counts[a[0]] > counts[b[0]] ? a : b
	  )[0] as Movement['direction'];
	}
  }