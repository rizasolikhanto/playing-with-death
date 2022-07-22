//import kaboom from 'kaboom';
//import kaboom from "https://unpkg.com/kaboom@next/dist/kaboom.mjs";

kaboom({
	global: true,
	scale: 4,
	clearColor: [0, 0, 0, 1],
	canvas: document.getElementById("game"),
	width: 180,
	height: 180,
});

loadSprite("player", "heroo.png");
loadSprite("wall", "wall2.png");
loadSprite("opendoor", "opendoor.png");
loadSprite("finaldoor", "finaldoor.png");
loadSprite("kunti", "kunti.png");
loadSprite("item", "item.png");

loadSound("horor", "horor.mp3");

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

window.onload = function () {
	const gameData = require("./game_map.json");

	//console.log(JSON.stringify(gameData[0]));

	// Goal is to exit the unstable dome after collecting two important items from the dome.
	let itemsHeld = [];
	let totalRooms = JSON.parse(JSON.stringify(gameData)).length;

	console.log("Total number of rooms:- ", totalRooms);

	scene("play", roomNumber => {
		const rooms = JSON.parse(JSON.stringify(gameData));

		const roomDetails = rooms[roomNumber];

		let popupMsg = null;
		let itemsHeldMsg = null;

		// Let's show message to show how many items player has to collect
		const showMsg = msg => {
			popupMsg = add([text(msg, 6), pos(width() / 2, 10), origin("center")]);
		};

		const updateItemsHeld = () => {
			if (itemsHeldMsg) {
				destroy(itemsHeldMsg);
			}

			itemsHeldMsg = add([text(`Ruang ${roomNumber}. Item : ${itemsHeld.length}`, 6), pos(80, 150), origin("center")]);
		};

		// Map characters of the room layout into the sprites that we have
		const roomConf = {
			width: roomDetails.layout[0].length,
			height: roomDetails.layout.length,
			pos: vec2(20, 20),
			"=": [sprite("wall"), solid(), "wall"],
			"@": [sprite("player"), "player"],
			"#": [sprite("kunti"), "kunti"],
			i: [sprite("item"), solid(), "item"],
		};

		// Mapping doors for each room
		for (const doorId in roomDetails.doors) {
			const door = roomDetails.doors[doorId];

			roomConf[doorId] = [
				sprite(door.itemsRequired > 0 ? "finaldoor" : "opendoor"),
				"door",
				{
					leadsTo: door.leadsTo,
					itemsRequired: door.itemsRequired,
					isEnd: door.isEnd || false,
				},
				solid(),
			];
		}

		addLevel(roomDetails.layout, roomConf);
		updateItemsHeld();

		const items = get("item");
		console.log("Items are:- ", items);
		console.log("Items held are:- ", itemsHeld);
		if (items.length > 0 && itemsHeld.includes(roomNumber)) {
			destroy(items[0]);
		}

		const player = get("player")[0];

		const directions = {
			left: vec2(-1, 0),
			right: vec2(1, 0),
			up: vec2(0, -1),
			down: vec2(0, 1),
		};

		// Map key presses to player movement actions.
		for (const direction in directions) {
			keyPress(direction, () => {
				// destroy any popup message 1/2 a second after the player starts to move again.
				if (popupMsg) {
					wait(0.5, () => {
						if (popupMsg) {
							destroy(popupMsg);
							popupMsg = null;
						}
					});
				}
			});

			keyDown(direction, () => {
				player.move(directions[direction].scale(60));
			});
		}

		// Event when player touches door
		player.overlaps("door", d => {
			wait(0.3, () => {
				// Does opening this door require more keys than the player holds?
				if (d.itemsRequired && d.itemsRequired > itemsHeld.length) {
					showMsg(`Kamu butuh ${d.itemsRequired - itemsHeld.length} kunci lagi!`);
					camShake(10);
				} else {
					// Does this door lead to the end
					if (d.isEnd) {
						go("winner");
					} else {
						go("play", d.leadsTo);
					}
				}
			});
		});

		// Event when player touches the item
		player.overlaps("item", i => {
			destroy(i);
			showMsg("kamu mendapatkan item!");

			//We need to store the room number, so next time they enter the room, they should not see it
			itemsHeld.push(roomNumber);
			updateItemsHeld();

			// Also Because the Cave is unstable, we will rotate and make player land in a random room
			let angle = 0.1;
			const timer = setInterval(() => {
				camRot(angle);
				angle += 0.1;

				if (angle >= 6.0) {
					// stop spinning and go to the new random room
					camRot(0);
					clearInterval(timer);

					let newRoomNumber = getRandomInt(totalRooms);

					console.log("New Room Number:- ", newRoomNumber);

					go("play", newRoomNumber);
				}
			}, 10);
		});
		collides("player", "kunti", (k, s) => {
			camShake(4);
			wait(1, () => {
				destroy(k);
			});
			go("lose");
		});
		// action("kunti", s => {
		// 	s.move(0, s.dir * 60);
		// 	s.timer -= dt();
		// 	if (s.timer <= 0) {
		// 		s.dir = -s.dir;
		// 		s.timer = rand(5);
		// 	}
		// });
		// Update the player position etc - run every frame.
		// play music
		player.action(() => {
			player.resolve();
		});
	});

	// Winner scene when the game comes to an end
	scene("winner", () => {
		add([text(`You have escaped `, 6), pos(width() / 2, height() / 2), origin("center")]);
		add([text(`Room successfully `, 6), pos(width() / 2 + 10, height() / 2 + 10), origin("center")]);
	});

	// Lose scene when the game comes to an end
	scene("lose", () => {
		add([text(`You are Death `, 6), pos(width() / 2, height() / 2), origin("center")]);
	});

	scene("instructions", () => {
		add([text("Instruksi", 6), pos(width() / 2, height() / 2), origin("center")]);

		add([text("1.Ruangan tidak stabil", 4), pos(width() / 2, height() / 2 + 10), origin("center")]);

		add([text("2.Player akan dilempar ke ruangan acak", 4), pos(width() / 2, height() / 2 + 20), origin("center")]);

		add([text("item di ruangan bisa diambil", 4), pos(width() / 2, height() / 2 + 30), origin("center")]);

		add([text("3. Terdapat 6 ruangan di dalam game", 4), pos(width() / 2, height() / 2 + 40), origin("center")]);

		add([text("4. Ada musuh yang akan membunuhmu ", 4), pos(width() / 2, height() / 2 + 40), origin("center")]);

		add([text("Ketik Spasi untuk memulai!", 6), pos(width() / 2, height() / 2 + 50), origin("center")]);

		keyPress("space", () => {
			go("play", 0);
		});
	});

	scene("main", () => {
		// Display a message telling the player on how to start a new game
		add([text("Ketik Spasi untuk memulai!", 6), pos(width() / 2, height() / 2), origin("center")]);

		add([text("Gunakan panah keyboard untuk bergerak", 4), pos(width() / 2 + 10, height() / 2 + 20), origin("center")]);

		add([text("Temukan dua kunci untuk keluar melalui pintu merah", 4), pos(width() / 2 + 40, height() / 2 + 40), origin("center")]);

		keyPress("space", () => {
			go("instructions");
		});
		// play music
		const music = play("horor", {
			volume: 0.1,
		});
		music.play();
	});
	start("main");
};
