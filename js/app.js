const parkingBlocks = {
  H: {
    name: 'Bloco H',
    image: 'assets/bloco-h.jpg',
    spots: [
      ['Vaga 01', 'green'],
      ['Vaga 02', 'green']
    ]
  },
  A: {
    name: 'Bloco A',
    image: 'assets/bloco-a.jpg',
    spots: []
  },
  C: {
    name: 'Bloco C',
    image: 'assets/bloco-c.jpg',
    spots: []
  }
};

let liveSensor = {
  online: false,
  distancia: 0,
  status: 'LIVRE',
  cor: 'VERDE',
  reservado: false,
  reservado_por: ''
};
let lastKnownStatus = '';

let selected = null;

const blocoURL = new URLSearchParams(window.location.search).get('bloco');
let currentBlock = ['A', 'C', 'H'].includes(blocoURL) ? blocoURL : 'H';

const DB_KEYS = {
  usuarios: 'senaiUsuarios',
  veiculos: 'senaiVeiculos',
  modelos: 'senaiModelos',
  marcas: 'senaiMarcas',
  vagas: 'senaiVagas',
  agendamentos: 'senaiAgendamentos',
  sancoes: 'senaiSancoes',
  pagamentos: 'senaiPagamentos'
};

function getDB(key) {
  return JSON.parse(localStorage.getItem(DB_KEYS[key]) || '[]');
}

function saveDB(key, data) {
  localStorage.setItem(DB_KEYS[key], JSON.stringify(data));
}

// =====================================================
// BASE DE MARCAS E MODELOS
// =====================================================
function inicializarDadosVeiculos() {
  let marcas = getDB('marcas');

  const novasMarcas = [
    { id_marca: 1, nome_marca: 'Toyota' },
    { id_marca: 2, nome_marca: 'Volkswagen' },
    { id_marca: 3, nome_marca: 'Chevrolet' },
    { id_marca: 4, nome_marca: 'Fiat' },
    { id_marca: 5, nome_marca: 'Honda' },
    { id_marca: 6, nome_marca: 'Hyundai' },
    { id_marca: 7, nome_marca: 'Ford' },
    { id_marca: 8, nome_marca: 'Nissan' },
    { id_marca: 9, nome_marca: 'Renault' },
    { id_marca: 10, nome_marca: 'Jeep' },
    { id_marca: 11, nome_marca: 'Peugeot' },
    { id_marca: 12, nome_marca: 'Citroën' },
    { id_marca: 13, nome_marca: 'Mitsubishi' },
    { id_marca: 14, nome_marca: 'Kia' },
    { id_marca: 15, nome_marca: 'BMW' },
    { id_marca: 16, nome_marca: 'Mercedes-Benz' },
    { id_marca: 17, nome_marca: 'Audi' },
    { id_marca: 18, nome_marca: 'Volvo' },
    { id_marca: 19, nome_marca: 'BYD' },
    { id_marca: 20, nome_marca: 'GWM' },
    { id_marca: 21, nome_marca: 'Caoa Chery' },
    { id_marca: 22, nome_marca: 'Land Rover' },
    { id_marca: 23, nome_marca: 'Porsche' },
    { id_marca: 24, nome_marca: 'Subaru' },
    { id_marca: 25, nome_marca: 'Suzuki' },
    { id_marca: 26, nome_marca: 'Lexus' },
    { id_marca: 27, nome_marca: 'RAM' },
    { id_marca: 28, nome_marca: 'Dodge' },
    { id_marca: 29, nome_marca: 'Chrysler' },
    { id_marca: 30, nome_marca: 'Jaguar' }
  ];

  novasMarcas.forEach(novaMarca => {
    if (!marcas.some(m => Number(m.id_marca) === novaMarca.id_marca)) {
      marcas.push(novaMarca);
    }
  });
  saveDB('marcas', marcas);

  let modelos = getDB('modelos');
  const novosModelos = [
    // TOYOTA
    { id_modelo: 1, nome_modelo: 'Corolla', id_marca: 1 },
    { id_modelo: 2, nome_modelo: 'Corolla Cross', id_marca: 1 },
    { id_modelo: 3, nome_modelo: 'Yaris', id_marca: 1 },
    { id_modelo: 4, nome_modelo: 'Yaris Sedan', id_marca: 1 },
    { id_modelo: 5, nome_modelo: 'Hilux', id_marca: 1 },
    { id_modelo: 6, nome_modelo: 'SW4', id_marca: 1 },
    { id_modelo: 7, nome_modelo: 'RAV4', id_marca: 1 },

    // VOLKSWAGEN
    { id_modelo: 8, nome_modelo: 'Gol', id_marca: 2 },
    { id_modelo: 9, nome_modelo: 'Polo', id_marca: 2 },
    { id_modelo: 10, nome_modelo: 'Virtus', id_marca: 2 },
    { id_modelo: 11, nome_modelo: 'T-Cross', id_marca: 2 },
    { id_modelo: 12, nome_modelo: 'Nivus', id_marca: 2 },
    { id_modelo: 13, nome_modelo: 'Taos', id_marca: 2 },
    { id_modelo: 14, nome_modelo: 'Tiguan', id_marca: 2 },
    { id_modelo: 15, nome_modelo: 'Saveiro', id_marca: 2 },
    { id_modelo: 16, nome_modelo: 'Amarok', id_marca: 2 },

    // CHEVROLET
    { id_modelo: 17, nome_modelo: 'Onix', id_marca: 3 },
    { id_modelo: 18, nome_modelo: 'Onix Plus', id_marca: 3 },
    { id_modelo: 19, nome_modelo: 'Tracker', id_marca: 3 },
    { id_modelo: 20, nome_modelo: 'Spin', id_marca: 3 },
    { id_modelo: 21, nome_modelo: 'Montana', id_marca: 3 },
    { id_modelo: 22, nome_modelo: 'S10', id_marca: 3 },
    { id_modelo: 23, nome_modelo: 'Trailblazer', id_marca: 3 },
    { id_modelo: 24, nome_modelo: 'Cruze', id_marca: 3 },
    { id_modelo: 25, nome_modelo: 'Equinox', id_marca: 3 },
    { id_modelo: 26, nome_modelo: 'Camaro', id_marca: 3 },

    // FIAT
    { id_modelo: 27, nome_modelo: 'Uno', id_marca: 4 },
    { id_modelo: 28, nome_modelo: 'Argo', id_marca: 4 },
    { id_modelo: 29, nome_modelo: 'Mobi', id_marca: 4 },
    { id_modelo: 30, nome_modelo: 'Cronos', id_marca: 4 },
    { id_modelo: 31, nome_modelo: 'Pulse', id_marca: 4 },
    { id_modelo: 32, nome_modelo: 'Fastback', id_marca: 4 },
    { id_modelo: 33, nome_modelo: 'Strada', id_marca: 4 },
    { id_modelo: 34, nome_modelo: 'Toro', id_marca: 4 },
    { id_modelo: 35, nome_modelo: 'Fiorino', id_marca: 4 },
    { id_modelo: 36, nome_modelo: 'Ducato', id_marca: 4 },

    // HONDA
    { id_modelo: 37, nome_modelo: 'Civic', id_marca: 5 },
    { id_modelo: 38, nome_modelo: 'City', id_marca: 5 },
    { id_modelo: 39, nome_modelo: 'City Hatchback', id_marca: 5 },
    { id_modelo: 40, nome_modelo: 'HR-V', id_marca: 5 },
    { id_modelo: 41, nome_modelo: 'ZR-V', id_marca: 5 },
    { id_modelo: 42, nome_modelo: 'CR-V', id_marca: 5 },
    { id_modelo: 43, nome_modelo: 'Fit', id_marca: 5 },

    // HYUNDAI
    { id_modelo: 44, nome_modelo: 'HB20', id_marca: 6 },
    { id_modelo: 45, nome_modelo: 'HB20S', id_marca: 6 },
    { id_modelo: 46, nome_modelo: 'Creta', id_marca: 6 },
    { id_modelo: 47, nome_modelo: 'Tucson', id_marca: 6 },
    { id_modelo: 48, nome_modelo: 'Santa Fe', id_marca: 6 },
    { id_modelo: 49, nome_modelo: 'ix35', id_marca: 6 },

    // FORD
    { id_modelo: 50, nome_modelo: 'Ka', id_marca: 7 },
    { id_modelo: 51, nome_modelo: 'Ka Sedan', id_marca: 7 },
    { id_modelo: 52, nome_modelo: 'Fiesta', id_marca: 7 },
    { id_modelo: 53, nome_modelo: 'Focus', id_marca: 7 },
    { id_modelo: 54, nome_modelo: 'EcoSport', id_marca: 7 },
    { id_modelo: 55, nome_modelo: 'Territory', id_marca: 7 },
    { id_modelo: 56, nome_modelo: 'Ranger', id_marca: 7 },
    { id_modelo: 57, nome_modelo: 'Maverick', id_marca: 7 },
    { id_modelo: 58, nome_modelo: 'Bronco', id_marca: 7 },

    // NISSAN
    { id_modelo: 59, nome_modelo: 'March', id_marca: 8 },
    { id_modelo: 60, nome_modelo: 'Versa', id_marca: 8 },
    { id_modelo: 61, nome_modelo: 'Kicks', id_marca: 8 },
    { id_modelo: 62, nome_modelo: 'Sentra', id_marca: 8 },
    { id_modelo: 63, nome_modelo: 'Frontier', id_marca: 8 },
    { id_modelo: 64, nome_modelo: 'X-Trail', id_marca: 8 },

    // RENAULT
    { id_modelo: 65, nome_modelo: 'Kwid', id_marca: 9 },
    { id_modelo: 66, nome_modelo: 'Sandero', id_marca: 9 },
    { id_modelo: 67, nome_modelo: 'Logan', id_marca: 9 },
    { id_modelo: 68, nome_modelo: 'Duster', id_marca: 9 },
    { id_modelo: 69, nome_modelo: 'Oroch', id_marca: 9 },
    { id_modelo: 70, nome_modelo: 'Captur', id_marca: 9 },
    { id_modelo: 71, nome_modelo: 'Master', id_marca: 9 },

    // JEEP
    { id_modelo: 72, nome_modelo: 'Renegade', id_marca: 10 },
    { id_modelo: 73, nome_modelo: 'Compass', id_marca: 10 },
    { id_modelo: 74, nome_modelo: 'Commander', id_marca: 10 },
    { id_modelo: 75, nome_modelo: 'Wrangler', id_marca: 10 },
    { id_modelo: 76, nome_modelo: 'Gladiator', id_marca: 10 },

    // PEUGEOT
    { id_modelo: 77, nome_modelo: '208', id_marca: 11 },
    { id_modelo: 78, nome_modelo: '2008', id_marca: 11 },
    { id_modelo: 79, nome_modelo: '3008', id_marca: 11 },
    { id_modelo: 80, nome_modelo: '5008', id_marca: 11 },
    { id_modelo: 81, nome_modelo: 'Partner', id_marca: 11 },

    // CITROËN
    { id_modelo: 82, nome_modelo: 'C3', id_marca: 12 },
    { id_modelo: 83, nome_modelo: 'C3 Aircross', id_marca: 12 },
    { id_modelo: 84, nome_modelo: 'C4 Cactus', id_marca: 12 },
    { id_modelo: 85, nome_modelo: 'C4', id_marca: 12 },
    { id_modelo: 86, nome_modelo: 'Jumpy', id_marca: 12 },

    // MITSUBISHI
    { id_modelo: 87, nome_modelo: 'L200', id_marca: 13 },
    { id_modelo: 88, nome_modelo: 'Pajero', id_marca: 13 },
    { id_modelo: 89, nome_modelo: 'Eclipse Cross', id_marca: 13 },
    { id_modelo: 90, nome_modelo: 'Outlander', id_marca: 13 },

    // KIA
    { id_modelo: 91, nome_modelo: 'Picanto', id_marca: 14 },
    { id_modelo: 92, nome_modelo: 'Cerato', id_marca: 14 },
    { id_modelo: 93, nome_modelo: 'Sportage', id_marca: 14 },
    { id_modelo: 94, nome_modelo: 'Sorento', id_marca: 14 },
    { id_modelo: 95, nome_modelo: 'Carnival', id_marca: 14 },

    // BMW
    { id_modelo: 96, nome_modelo: 'Série 1', id_marca: 15 },
    { id_modelo: 97, nome_modelo: 'Série 2', id_marca: 15 },
    { id_modelo: 98, nome_modelo: 'Série 3', id_marca: 15 },
    { id_modelo: 99, nome_modelo: 'Série 4', id_marca: 15 },
    { id_modelo: 100, nome_modelo: 'Série 5', id_marca: 15 },
    { id_modelo: 101, nome_modelo: 'X1', id_marca: 15 },
    { id_modelo: 102, nome_modelo: 'X3', id_marca: 15 },
    { id_modelo: 103, nome_modelo: 'X5', id_marca: 15 },
    { id_modelo: 104, nome_modelo: 'X6', id_marca: 15 },

    // MERCEDES-BENZ
    { id_modelo: 105, nome_modelo: 'Classe A', id_marca: 16 },
    { id_modelo: 106, nome_modelo: 'Classe C', id_marca: 16 },
    { id_modelo: 107, nome_modelo: 'Classe E', id_marca: 16 },
    { id_modelo: 108, nome_modelo: 'Classe S', id_marca: 16 },
    { id_modelo: 109, nome_modelo: 'GLA', id_marca: 16 },
    { id_modelo: 110, nome_modelo: 'GLC', id_marca: 16 },
    { id_modelo: 111, nome_modelo: 'GLE', id_marca: 16 },

    // AUDI
    { id_modelo: 112, nome_modelo: 'A1', id_marca: 17 },
    { id_modelo: 113, nome_modelo: 'A3', id_marca: 17 },
    { id_modelo: 114, nome_modelo: 'A4', id_marca: 17 },
    { id_modelo: 115, nome_modelo: 'A5', id_marca: 17 },
    { id_modelo: 116, nome_modelo: 'A6', id_marca: 17 },
    { id_modelo: 117, nome_modelo: 'Q3', id_marca: 17 },
    { id_modelo: 118, nome_modelo: 'Q5', id_marca: 17 },
    { id_modelo: 119, nome_modelo: 'Q7', id_marca: 17 },

    // VOLVO
    { id_modelo: 120, nome_modelo: 'XC40', id_marca: 18 },
    { id_modelo: 121, nome_modelo: 'XC60', id_marca: 18 },
    { id_modelo: 122, nome_modelo: 'XC90', id_marca: 18 },
    { id_modelo: 123, nome_modelo: 'S60', id_marca: 18 },
    { id_modelo: 124, nome_modelo: 'S90', id_marca: 18 },

    // BYD
    { id_modelo: 125, nome_modelo: 'Dolphin', id_marca: 19 },
    { id_modelo: 126, nome_modelo: 'Dolphin Mini', id_marca: 19 },
    { id_modelo: 127, nome_modelo: 'Yuan Plus', id_marca: 19 },
    { id_modelo: 128, nome_modelo: 'Song Plus', id_marca: 19 },
    { id_modelo: 129, nome_modelo: 'King', id_marca: 19 },
    { id_modelo: 130, nome_modelo: 'Seal', id_marca: 19 },

    // GWM
    { id_modelo: 131, nome_modelo: 'Haval H6', id_marca: 20 },
    { id_modelo: 132, nome_modelo: 'Haval H6 GT', id_marca: 20 },
    { id_modelo: 133, nome_modelo: 'Haval H6 HEV', id_marca: 20 },
    { id_modelo: 134, nome_modelo: 'Ora 03', id_marca: 20 },
    { id_modelo: 135, nome_modelo: 'Tank 300', id_marca: 20 },

    // CAOA CHERY
    { id_modelo: 136, nome_modelo: 'Tiggo 5X', id_marca: 21 },
    { id_modelo: 137, nome_modelo: 'Tiggo 7', id_marca: 21 },
    { id_modelo: 138, nome_modelo: 'Tiggo 8', id_marca: 21 },
    { id_modelo: 139, nome_modelo: 'Arrizo 6', id_marca: 21 },

    // LAND ROVER
    { id_modelo: 140, nome_modelo: 'Evoque', id_marca: 22 },
    { id_modelo: 141, nome_modelo: 'Discovery Sport', id_marca: 22 },
    { id_modelo: 142, nome_modelo: 'Discovery', id_marca: 22 },
    { id_modelo: 143, nome_modelo: 'Defender', id_marca: 22 },
    { id_modelo: 144, nome_modelo: 'Range Rover Sport', id_marca: 22 },

    // PORSCHE
    { id_modelo: 145, nome_modelo: '911', id_marca: 23 },
    { id_modelo: 146, nome_modelo: '718', id_marca: 23 },
    { id_modelo: 147, nome_modelo: 'Macan', id_marca: 23 },
    { id_modelo: 148, nome_modelo: 'Cayenne', id_marca: 23 },
    { id_modelo: 149, nome_modelo: 'Panamera', id_marca: 23 },

    // SUBARU
    { id_modelo: 150, nome_modelo: 'Impreza', id_marca: 24 },
    { id_modelo: 151, nome_modelo: 'Forester', id_marca: 24 },
    { id_modelo: 152, nome_modelo: 'XV', id_marca: 24 },
    { id_modelo: 153, nome_modelo: 'Outback', id_marca: 24 },

    // SUZUKI
    { id_modelo: 154, nome_modelo: 'Jimny', id_marca: 25 },
    { id_modelo: 155, nome_modelo: 'Vitara', id_marca: 25 },
    { id_modelo: 156, nome_modelo: 'S-Cross', id_marca: 25 },

    // LEXUS
    { id_modelo: 157, nome_modelo: 'UX', id_marca: 26 },
    { id_modelo: 158, nome_modelo: 'NX', id_marca: 26 },
    { id_modelo: 159, nome_modelo: 'RX', id_marca: 26 },
    { id_modelo: 160, nome_modelo: 'ES', id_marca: 26 },

    // RAM
    { id_modelo: 161, nome_modelo: 'Rampage', id_marca: 27 },
    { id_modelo: 162, nome_modelo: '1500', id_marca: 27 },
    { id_modelo: 163, nome_modelo: '2500', id_marca: 27 },
    { id_modelo: 164, nome_modelo: '3500', id_marca: 27 },

    // DODGE
    { id_modelo: 165, nome_modelo: 'Challenger', id_marca: 28 },
    { id_modelo: 166, nome_modelo: 'Charger', id_marca: 28 },
    { id_modelo: 167, nome_modelo: 'Durango', id_marca: 28 },

    // CHRYSLER
    { id_modelo: 168, nome_modelo: '300C', id_marca: 29 },
    { id_modelo: 169, nome_modelo: 'Pacifica', id_marca: 29 },

    // JAGUAR
    { id_modelo: 170, nome_modelo: 'XE', id_marca: 30 },
    { id_modelo: 171, nome_modelo: 'XF', id_marca: 30 },
    { id_modelo: 172, nome_modelo: 'F-Pace', id_marca: 30 },
    { id_modelo: 173, nome_modelo: 'E-Pace', id_marca: 30 }
  ];

  novosModelos.forEach(novoModelo => {
    if (!modelos.some(m => Number(m.id_modelo) === novoModelo.id_modelo)) {
      modelos.push(novoModelo);
    }
  });
  saveDB('modelos', modelos);
}

function buscarMarca(idMarca) {
  return getDB('marcas').find(m => Number(m.id_marca) === Number(idMarca));
}

function buscarModelo(idModelo) {
  return getDB('modelos').find(m => Number(m.id_modelo) === Number(idModelo));
}

// =====================================================
// PERSISTÊNCIA DE VEÍCULOS NO MYSQL
// =====================================================
function mostrarMeuVeiculo() {
  const usuario = localStorage.getItem('senaiUser') || 'Adrian';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  // Consulta veículos do MySQL
  fetch(`acoes.php?acao=obter_veiculos&usuario=${encodeURIComponent(usuario)}&id_usuario=${usuarioId}`)
    .then(r => r.json())
    .then(veiculos => {
      // 1. Atualiza na página veiculos.html
      const container = document.getElementById('meuVeiculo');
      if (container) {
        if (!Array.isArray(veiculos) || !veiculos.length) {
          container.innerHTML = '<div class="empty-message">Nenhum veículo cadastrado no banco de dados para este usuário. Use o formulário ao lado para cadastrar.</div>';
        } else {
          container.innerHTML = veiculos.map(v => `
            <div class="vehicle-mini-card" style="border:1px solid var(--line); border-radius:12px; padding:16px; background:var(--card); margin-bottom:12px; display:flex; flex-direction:column; gap:8px; box-shadow:0 8px 18px rgba(15,23,42,0.04);">
              <div class="info-row" style="display:flex; justify-content:space-between; gap:12px; border-bottom:1px solid var(--line); padding-bottom:8px;">
                <strong>Placa</strong>
                <span style="font-family:monospace; font-weight:700; color:var(--blue); font-size:15px;">${v.placa}</span>
              </div>
              <div class="info-row" style="display:flex; justify-content:space-between; gap:12px; border-bottom:1px solid var(--line); padding-bottom:8px;">
                <strong>Marca</strong>
                <span>${v.marca}</span>
              </div>
              <div class="info-row" style="display:flex; justify-content:space-between; gap:12px; border-bottom:1px solid var(--line); padding-bottom:8px;">
                <strong>Modelo</strong>
                <span style="font-weight:600;">${v.modelo}</span>
              </div>
              <div class="info-row" style="display:flex; justify-content:space-between; gap:12px; margin-bottom:8px;">
                <strong>Cor</strong>
                <span>${v.cor}</span>
              </div>
              <button
                type="button"
                class="btn btn-light"
                style="width:100%; color:#dc2626; border-color:#fecaca; margin-top:4px;"
                onclick="excluirVeiculoBanco(${v.id}, '${v.placa}')"
              >
                Excluir veículo do banco
              </button>
            </div>
          `).join('');
        }
      }

      // 2. Atualiza no painel geral (painel.html)
      const pPlaca = document.getElementById('veiculoPlaca');
      const pCor = document.getElementById('veiculoCor');
      const pModelo = document.getElementById('veiculoModelo');
      const pMarca = document.getElementById('veiculoMarca');

      if (pPlaca || pCor || pModelo || pMarca) {
        if (Array.isArray(veiculos) && veiculos.length > 0) {
          const prim = veiculos[0];
          if (pPlaca) pPlaca.innerHTML = `<span style="font-family:monospace; font-weight:700; color:var(--blue); font-size:14px;">${prim.placa}</span>`;
          if (pCor) pCor.textContent = prim.cor;
          if (pModelo) pModelo.textContent = prim.modelo;
          if (pMarca) pMarca.textContent = prim.marca;
        } else {
          if (pPlaca) pPlaca.textContent = 'Não cadastrada';
          if (pCor) pCor.textContent = 'Não cadastrada';
          if (pModelo) pModelo.textContent = 'Não cadastrado';
          if (pMarca) pMarca.textContent = 'Não cadastrada';
        }
      }
    })
    .catch(err => {
      console.warn('Erro ao carregar veículos do banco:', err);
    });
}

window.excluirVeiculoBanco = function(id, placa) {
  if (!confirm(`Deseja realmente excluir o veículo com placa ${placa} do banco de dados?`)) return;

  const usuario = localStorage.getItem('senaiUser') || '';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  const formData = new FormData();
  formData.append('id', id);
  formData.append('placa', placa);
  formData.append('usuario', usuario);
  formData.append('id_usuario', usuarioId);

  fetch('acoes.php?acao=excluir_veiculo', {
    method: 'POST',
    body: formData
  })
    .then(r => r.json())
    .then(data => {
      if (data.sucesso) {
        toast('Veículo removido com sucesso!');
        mostrarMeuVeiculo();
      } else {
        toast(data.mensagem || 'Erro ao remover veículo.');
      }
    })
    .catch(() => toast('Erro de comunicação com o servidor.'));
};

function configurarFormularioVeiculos() {
  const marcaSelect = document.getElementById('marca');
  const modeloSelect = document.getElementById('modelo');
  const form = document.getElementById('vehicleForm');
  const listaMarcas = document.getElementById('listaMarcas');
  const listaModelos = document.getElementById('listaModelos');

  const renderListaMarcas = () => {
    const marcas = getDB('marcas');
    if (listaMarcas) {
      listaMarcas.innerHTML = marcas.length
        ? marcas.map(m => `<div class="data-item"><span>${m.nome_marca}</span></div>`).join('')
        : '<div class="empty-message">Nenhuma marca cadastrada.</div>';
    }
    if (marcaSelect) {
      marcaSelect.innerHTML = '<option value="">Selecione uma marca...</option>' +
        marcas.map(m => `<option value="${m.id_marca}">${m.nome_marca}</option>`).join('');
    }
  };

  const renderListaModelos = () => {
    const modelos = getDB('modelos');
    if (listaModelos) {
      listaModelos.innerHTML = modelos.length
        ? modelos.map(m => `<div class="data-item"><span>${m.nome_modelo}</span></div>`).join('')
        : '<div class="empty-message">Nenhum modelo cadastrado.</div>';
    }
  };

  const atualizarModelos = (idMarca) => {
    if (!modeloSelect) return;
    const modelos = getDB('modelos').filter(m => Number(m.id_marca) === Number(idMarca));
    if (!idMarca || !modelos.length) {
      modeloSelect.disabled = true;
      modeloSelect.innerHTML = '<option value="">Primeiro selecione uma marca...</option>';
      return;
    }
    modeloSelect.disabled = false;
    modeloSelect.innerHTML = '<option value="">Selecione um modelo...</option>' +
      modelos.map(m => `<option value="${m.id_modelo}">${m.nome_modelo}</option>`).join('');
  };

  if (marcaSelect) {
    marcaSelect.addEventListener('change', e => atualizarModelos(e.target.value));
  }

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const placa = document.getElementById('placa')?.value.trim().toUpperCase();
      const cor = document.getElementById('cor')?.value;
      const idMarca = document.getElementById('marca')?.value;
      const idModelo = document.getElementById('modelo')?.value;

      if (!placa || !cor || !idMarca || !idModelo) {
        toast('Preencha placa, cor, marca e modelo antes de cadastrar.');
        return;
      }

      const objMarca = buscarMarca(idMarca);
      const objModelo = buscarModelo(idModelo);
      const nomeMarca = objMarca ? objMarca.nome_marca : 'Marca';
      const nomeModelo = objModelo ? objModelo.nome_modelo : 'Modelo';

      const usuario = localStorage.getItem('senaiUser') || 'Adrian';
      const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

      const formData = new FormData();
      formData.append('usuario', usuario);
      formData.append('id_usuario', usuarioId);
      formData.append('placa', placa);
      formData.append('cor', cor);
      formData.append('marca', nomeMarca);
      formData.append('modelo', nomeModelo);

      fetch('acoes.php?acao=salvar_veiculo', {
        method: 'POST',
        body: formData
      })
        .then(r => r.json())
        .then(data => {
          if (data.sucesso) {
            toast(`Veículo ${nomeMarca} ${nomeModelo} (${placa}) cadastrado com sucesso no MySQL!`);
            form.reset();
            if (marcaSelect) marcaSelect.value = '';
            atualizarModelos('');
            mostrarMeuVeiculo();
          } else {
            toast(data.mensagem || 'Erro ao cadastrar veículo.');
          }
        })
        .catch(() => toast('Erro ao salvar veículo no servidor.'));
    });
  }

  renderListaMarcas();
  renderListaModelos();
  atualizarModelos(marcaSelect?.value || '');
}

// =====================================================
// AGENDAMENTOS E MAPEAMENTO DAS VAGAS
// =====================================================
function allSpots() {
  return Object.values(parkingBlocks).flatMap(b => b.spots.map(s => ({ ...s, block: b.name })));
}

function getReservations() {
  return JSON.parse(localStorage.getItem('senaiReservations') || '[]');
}

function saveReservations(v) {
  localStorage.setItem('senaiReservations', JSON.stringify(v));
}

function getSanctions() {
  return JSON.parse(localStorage.getItem('senaiSanctions') || '[]');
}

function saveSanctions(v) {
  localStorage.setItem('senaiSanctions', JSON.stringify(v));
}

function statusFor(spot) {
  if (!spot) return 'green';
  const id = Array.isArray(spot) ? spot[0] : (spot.id || spot[0]);

  // Se tiver dados específicos para a vaga no liveSensor.vagas
  const vagaSensor = liveSensor?.vagas?.[id];
  if (vagaSensor) {
    if (vagaSensor.reservado) {
      return 'yellow';
    }
    if (liveSensor.online && vagaSensor.distancia > 0) {
      if (vagaSensor.distancia <= 8.0) {
        return 'red';
      } else {
        return 'green';
      }
    }
  }

  // Fallback para Vaga 01 (modo legado)
  if (id === 'Vaga 01') {
    if (liveSensor.reservado) {
      return 'yellow';
    }
    if (liveSensor.online && liveSensor.distancia > 0) {
      if (liveSensor.distancia <= 8.0) {
        return 'red';
      } else {
        return 'green';
      }
    }
  }

  const r = getReservations().find(x => x.id === id && x.active);
  if (r) {
    return 'yellow';
  }

  return (Array.isArray(spot) ? spot[1] : (spot.status || spot[1])) || 'green';
}

function renderMap(blockKey, targetId = 'map') {
  currentBlock = blockKey;
  const b = parkingBlocks[blockKey];
  const el = document.getElementById(targetId);
  if (!el) return;

  const spots = b?.spots || [];

  if (!spots.length) {
    el.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--muted); max-width:440px;">
        <div style="font-size:42px; margin-bottom:12px;">🚧</div>
        <h3 style="color:var(--text); margin-bottom:8px;">${b?.name || 'Bloco'} sem vagas ativas</h3>
        <p style="font-size:13px; line-height:1.5;">Nenhuma vaga física está conectada neste bloco no momento. Alterne para o <strong>Bloco H</strong> para visualizar e agendar as vagas com sensores ultrassônicos.</p>
      </div>
    `;
    populateSpotSelector(blockKey);
    return;
  }

  // Renderiza a região esquemática das vagas (sem usar foto do bloco)
  const baysHtml = spots.map(s => {
    const spotId = s[0];
    const st = statusFor(s);
    const label = st === 'green' ? 'Livre' : st === 'red' ? 'Ocupada' : 'Agendada';
    const isSel = (selected && selected.s[0] === spotId) ? 'selected' : '';

    const vObj = liveSensor?.vagas?.[spotId];
    const dVal = (vObj && vObj.distancia > 0) ? vObj.distancia : (spotId === 'Vaga 01' ? liveSensor.distancia : 0);
    const distTxt = liveSensor.online ? (dVal > 0 ? (dVal.toFixed(1) + ' cm') : 'Sem leitura') : 'Desconectado';

    return `
      <div class="bay-card bay-${st} ${isSel}" id="bayCard_${spotId.replace(/\s+/g, '_')}" onclick="selecionarVagaPeloCard('${spotId}')">
        <div class="bay-header">
          <span class="bay-title">${spotId}</span>
          <span class="bay-indicator ${st}">
            <i class="i-${st}"></i> ${label}
          </span>
        </div>
        <div class="bay-body">
          <div class="bay-info-row">
            <span>Sensor:</span>
            <strong>${distTxt}</strong>
          </div>
          <div class="bay-info-row">
            <span>Status:</span>
            <strong>${st === 'green' ? 'Disponível' : (st === 'yellow' ? 'Agendada' : 'Ocupada')}</strong>
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="parking-zone-container">
      <div class="parking-road">
        <span>🚗 ÁREA DE CIRCULAÇÃO • ESTACIONAMENTO</span>
        <span>${b?.name || 'Bloco'}</span>
      </div>
      <div class="parking-bays">
        ${baysHtml}
      </div>
    </div>
  `;

  populateSpotSelector(blockKey);
}

function setSelectorStatusColor(select, status = '') {
  if (!select) return;
  select.classList.remove('status-green', 'status-red', 'status-yellow');
  if (status) select.classList.add(`status-${status}`);
}

function populateSpotSelector(blockKey, keepId = '') {
  const sel = document.getElementById('spotSelector');
  if (!sel) return;
  const spots = parkingBlocks[blockKey]?.spots || [];
  if (!spots.length) {
    sel.innerHTML = '<option value="">Nenhuma vaga neste bloco</option>';
    setSelectorStatusColor(sel, '');
    const box = document.getElementById('spotDetail');
    if (box) box.innerHTML = '<div class="empty">Nenhuma vaga cadastrada neste bloco. O sensor físico HC-SR04 está monitorando a <strong>Vaga 01</strong> no <strong>Bloco H</strong>.</div>';
    return;
  }

  const defaultId = keepId || spots[0][0];

  sel.innerHTML = '<option value="">Selecione uma vaga...</option>' +
    spots.map(s => {
      const st = statusFor(s);
      const label = st === 'green' ? 'Livre' : st === 'red' ? 'Ocupada' : 'Agendada';
      const color = st === 'green' ? 'var(--green)' : st === 'red' ? 'var(--red)' : 'var(--yellow)';
      return `<option value="${s[0]}" class="spot-option ${st}" style="color:${color}">${s[0]} — ${label}</option>`;
    }).join('');

  if (defaultId) {
    sel.value = defaultId;
    updateSelectorStatus(defaultId, blockKey);
    showSelectedFromSelector(defaultId, blockKey);
  }
}

function updateSelectorStatus(id, blockKey = currentBlock) {
  const sel = document.getElementById('spotSelector');
  if (!sel || !id) {
    setSelectorStatusColor(sel, '');
    return;
  }
  const s = parkingBlocks[blockKey]?.spots?.find(x => x[0] === id);
  setSelectorStatusColor(sel, s ? statusFor(s) : '');
}

// Carrega os veículos do banco de dados na caixa de seleção de agendamento
function carregarVeiculosAgendamento() {
  const select = document.getElementById('vehicleSelector');
  if (!select) return;

  const usuario = localStorage.getItem('senaiUser') || 'Adrian';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  select.innerHTML = '<option value="">Carregando seus veículos do banco...</option>';

  fetch(`acoes.php?acao=obter_veiculos&usuario=${encodeURIComponent(usuario)}&id_usuario=${usuarioId}`)
    .then(r => r.json())
    .then(veiculos => {
      if (!Array.isArray(veiculos) || !veiculos.length) {
        select.innerHTML = '<option value="PADRAO-01">Veículo padrão (sem cadastro no banco)</option>';
        return;
      }

      select.innerHTML = '<option value="">Selecione um veículo...</option>' +
        veiculos.map(v => `<option value="${v.placa}">${v.marca} ${v.modelo} — ${v.placa} (${v.cor})</option>`).join('');

      // Seleciona o primeiro veículo por padrão
      if (veiculos.length > 0) {
        select.value = veiculos[0].placa;
      }
    })
    .catch(() => {
      select.innerHTML = '<option value="PADRAO-01">Veículo padrão</option>';
    });
}

function showSelectedFromSelector(id, blockKey = currentBlock) {
  const s = parkingBlocks[blockKey]?.spots?.find(x => x[0] === id);
  if (!s) {
    selected = null;
    return;
  }

  selected = { s, blockKey };
  const box = document.getElementById('spotDetail');
  if (!box) return;

  const st = statusFor(s);
  lastKnownStatus = st;
  const today = new Date().toISOString().slice(0, 10);

  const isBookingPage = location.pathname.endsWith('/agendar.html') || location.pathname.endsWith('agendar.html');

  const usuarioLogado = (localStorage.getItem('senaiUser') || '').trim();
  const usuarioIdLogado = Number(localStorage.getItem('senaiUserId')) || 0;
  
  // Agendamento específico para a vaga selecionada (Vaga 01 ou Vaga 02)
  const vagaSensorObj = liveSensor?.vagas?.[s[0]];
  const agendamento = vagaSensorObj?.agendamento || (s[0] === 'Vaga 01' ? liveSensor?.agendamento : null);
  const distanciaAtual = (vagaSensorObj && vagaSensorObj.distancia > 0)
    ? vagaSensorObj.distancia
    : (s[0] === 'Vaga 01' ? liveSensor.distancia : 0.0);

  let ehDonoDoAgendamento = false;
  if (agendamento) {
    if (usuarioLogado === 'admin' || usuarioIdLogado === 1) {
      ehDonoDoAgendamento = true;
    } else if (usuarioIdLogado > 0 && agendamento.id_usuario > 0 && usuarioIdLogado === agendamento.id_usuario) {
      ehDonoDoAgendamento = true;
    } else if (usuarioLogado && (usuarioLogado.toLowerCase() === (agendamento.usuario_login || '').toLowerCase() || usuarioLogado.toLowerCase() === (agendamento.nome || '').toLowerCase())) {
      ehDonoDoAgendamento = true;
    }
  }

  let action;
  if (isBookingPage && st === 'green') {
    action = `
      <label class="field-label">
        Data<br>
        <input id="reserveDate" type="date" value="${today}" min="${today}" required>
      </label>

      <label class="field-label">
        Veículo cadastrado no banco<br>
        <select id="vehicleSelector" class="spot-selector" required>
          <option value="">Carregando veículos...</option>
        </select>
      </label>

      <label class="field-label">
        Horário<br>
        <input id="reserveTime" type="time" value="18:00" required>
      </label>

      <button class="btn btn-primary full" onclick="reserveSelected()">
        Confirmar agendamento
      </button>
    `;
  } else if (isBookingPage) {
    if (st === 'yellow') {
      if (ehDonoDoAgendamento) {
        action = `
          <button class="btn btn-danger full" style="margin-bottom:8px;" onclick="cancelReservation('${s[0]}')">
            Cancelar meu agendamento / Liberar vaga
          </button>
          <div style="font-size:12px;color:var(--muted);text-align:center;">
            Você agendou esta vaga. Clique acima se desejar liberá-la.
          </div>
        `;
      } else {
        action = `
          <button class="btn btn-light" disabled style="width:100%;color:var(--yellow);font-weight:600;padding:12px">
            🔒 Vaga agendada por outro usuário
          </button>
          <div style="font-size:12px;color:var(--muted);text-align:center;margin-top:6px;">
            Apenas quem realizou a reserva pode cancelá-la.
          </div>
        `;
      }
    } else {
      action = `
        <button class="btn btn-light" disabled style="width:100%;color:var(--red);font-weight:600;padding:12px">
          ⛔ Vaga ocupada (Sensor detectou veículo)
        </button>
      `;
    }
  } else {
    action = `
      <div class="view-only-note">
        Modo de visualização: esta página não permite agendamentos.<br>
        <a href="agendar.html">Ir para Novo agendamento</a> para reservar uma vaga.
      </div>
    `;
  }

  // Monta as linhas extras quando a vaga estiver agendada
  let metaAgendamento = '';
  if (st === 'yellow' && agendamento) {
    const nomeExibicao = agendamento.primeiro_nome || agendamento.nome || 'Usuário';
    const modeloExibicao = agendamento.modelo || 'Não informado';
    const horaExibicao = agendamento.horario || '—';

    metaAgendamento = `
      <div id="metaAgendamentoBox" style="display:grid; gap:8px; margin:4px 0;">
        <div class="meta-row" style="background:rgba(255, 183, 3, 0.12); padding:6px 10px; border-radius:6px; border-left:3px solid var(--yellow);">
          <span>Agendado por</span>
          <strong style="color:var(--text); font-weight:700;">${nomeExibicao}</strong>
        </div>
        <div class="meta-row" style="background:rgba(255, 183, 3, 0.12); padding:6px 10px; border-radius:6px; border-left:3px solid var(--yellow);">
          <span>Modelo do veículo</span>
          <strong style="color:var(--text); font-weight:700;">${modeloExibicao}</strong>
        </div>
        <div class="meta-row" style="background:rgba(255, 183, 3, 0.12); padding:6px 10px; border-radius:6px; border-left:3px solid var(--yellow);">
          <span>Horário agendado</span>
          <strong style="color:var(--text); font-weight:700;">${horaExibicao}</strong>
        </div>
      </div>
    `;
  }

  box.innerHTML = `
    <div class="detail-top">
      <div class="eyebrow">Vaga monitorada</div>
      <div class="detail-id">${s[0]}</div>

      <div class="detail-status">
        <span class="badge ${st}">
          ${st === 'green' ? 'Livre' : st === 'red' ? 'Ocupada' : 'Agendada'}
        </span>
      </div>

      <div class="detail-meta">
        <div class="meta-row">
          <span>Local</span>
          <strong>${parkingBlocks[blockKey].name}</strong>
        </div>

        <div class="meta-row">
          <span>Identificação</span>
          <strong>${s[0]}</strong>
        </div>

        <div class="meta-row">
          <span>Disponibilidade</span>
          <strong>
            ${st === 'green' ? 'Pode ser reservada' : st === 'yellow' ? 'Reserva ativa' : 'Indisponível (Ocupada)'}
          </strong>
        </div>

        ${metaAgendamento}

        <div class="meta-row">
          <span>Sensor Ultrassônico</span>
          <strong id="sensorDistance">${liveSensor.online ? (distanciaAtual > 0 ? (distanciaAtual.toFixed(1) + ' cm') : 'Sem leitura') : 'Desconectado'}</strong>
        </div>

        <div class="meta-row">
          <span>LED Físico (ESP8266)</span>
          <strong id="sensorLed">${st === 'green' ? 'Verde (Livre)' : st === 'red' ? 'Vermelho (Ocupada)' : 'Amarelo (Agendada)'}</strong>
        </div>
      </div>
    </div>

    <div class="detail-action">${action}</div>
  `;

  if (isBookingPage && st === 'green') {
    carregarVeiculosAgendamento();
  }
}

function onSpotSelectorChange(value) {
  updateSelectorStatus(value, currentBlock);
  if (!value) {
    selected = null;
    const box = document.getElementById('spotDetail');
    if (box) box.innerHTML = '<div class="empty">Selecione uma vaga na barra ao lado do mapa para consultar seus dados.</div>';
    return;
  }
  showSelectedFromSelector(value, currentBlock);
}

function reserveSelected() {
  if (!selected) return;
  const [id] = selected.s;
  const st = statusFor(selected.s);
  if (st === 'red') {
    toast('Não é possível agendar uma vaga que está ocupada pelo sensor.');
    return;
  }
  const date = document.getElementById('reserveDate')?.value;
  const time = document.getElementById('reserveTime')?.value;
  if (!date || !time) {
    toast('Informe data e horário.');
    return;
  }

  const login = localStorage.getItem('senaiUser') || 'Adrian';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;
  const placa = document.getElementById('vehicleSelector')?.value || '---';

  // Notifica o backend PHP e grava no MySQL
  const formData = new FormData();
  formData.append('nome', login);
  formData.append('id_usuario', usuarioId);
  formData.append('placa', placa);
  formData.append('vaga', id);
  formData.append('bloco', selected.blockKey);
  formData.append('data_reserva', date);
  formData.append('horario', time);

  fetch('acoes.php?acao=agendar', {
    method: 'POST',
    body: formData
  })
    .then(r => r.json())
    .then(data => {
      toast(`${id} agendada para ${date.split('-').reverse().join('/')} às ${time} com o veículo ${placa}!`);

      // Atualiza estado local
      const reservations = getReservations();
      reservations.push({
        id,
        block: selected.blockKey,
        date,
        time,
        scheduledAt: `${date}T${time}`,
        active: true,
        status: 'scheduled',
        user: login,
        plate: placa
      });
      saveReservations(reservations);

      liveSensor.reservado = true;
      liveSensor.reservado_por = login;

      renderMap(currentBlock);
      pollSensor();

      if (document.getElementById('spotDetail')) {
        document.getElementById('spotDetail').innerHTML = `
          <div class="empty">
            Reserva realizada com sucesso no banco de dados!<br>
            O LED da vaga física no ESP8266 agora está <strong>Amarelo</strong>.<br><br>
            Veículo: <strong>${placa}</strong><br>
            Você pode conferir em <a href="minhas-vagas.html">Minhas vagas</a>.
          </div>
        `;
      }
    })
    .catch(err => {
      console.error(err);
      toast('Erro ao processar agendamento no servidor.');
    });
}

function cancelReservation(id) {
  const usuario = localStorage.getItem('senaiUser') || '';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;
  const vagaParam = id ? `&vaga=${encodeURIComponent(id)}` : '';

  // Chamada de liberação no MySQL com verificação de proprietário
  fetch(`acoes.php?acao=liberar&usuario=${encodeURIComponent(usuario)}&id_usuario=${usuarioId}${vagaParam}`)
    .then(r => r.json())
    .then(data => {
      if (!data.sucesso) {
        toast(data.mensagem || 'Você não tem permissão para cancelar este agendamento.');
        return;
      }

      // Limpa do localStorage também
      const rs = getReservations();
      rs.forEach(x => {
        if (!id || x.id === id) {
          x.active = false;
          x.status = 'cancelled';
        }
      });
      saveReservations(rs);

      if (liveSensor?.vagas?.[id]) {
        liveSensor.vagas[id].reservado = false;
        liveSensor.vagas[id].reservado_por = '';
        liveSensor.vagas[id].agendamento = null;
      }
      if (!id || id === 'Vaga 01') {
        liveSensor.reservado = false;
        liveSensor.reservado_por = '';
        liveSensor.agendamento = null;
      }
      lastKnownStatus = '';

      toast('Vaga desagendada com sucesso! O LED voltou para o modo automático.');
      
      renderMap(currentBlock);
      pollSensor();

      if (document.getElementById('spotDetail')) {
        showSelectedFromSelector(id || 'Vaga 01', currentBlock);
      }
    })
    .catch(() => toast('Erro ao cancelar agendamento.'));
}

// Carrega reservas do banco de dados na página minhas-vagas.html
function carregarMinhasVagas() {
  const table = document.getElementById('reservationTable');
  if (!table) return;

  const usuario = localStorage.getItem('senaiUser') || '';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  table.innerHTML = '<tr><td colspan="6" class="empty">Carregando agendamentos do banco...</td></tr>';

  fetch(`acoes.php?acao=obter_agendamentos&usuario=${encodeURIComponent(usuario)}&id_usuario=${usuarioId}`)
    .then(r => r.json())
    .then(agendamentos => {
      if (!Array.isArray(agendamentos) || !agendamentos.length) {
        table.innerHTML = '<tr><td colspan="6" class="empty">Nenhum agendamento ativo no momento.</td></tr>';
        return;
      }

      table.innerHTML = agendamentos.map(r => {
        const veiculoDesc = (r.marca && r.modelo)
          ? `${r.marca} ${r.modelo} • <span style="font-family:monospace; font-weight:700;">${r.placa}</span>`
          : `<span style="font-family:monospace; font-weight:700;">${r.placa}</span>`;

        const dataFmt = r.data_reserva
          ? r.data_reserva.split('-').reverse().join('/')
          : (r.data_hora ? r.data_hora.slice(0, 10).split('-').reverse().join('/') : '—');

        const horaFmt = r.horario || (r.data_hora ? r.data_hora.slice(11, 16) : '—');

        return `
          <tr>
            <td><strong>${r.vaga || 'Vaga 01'}</strong></td>
            <td>Bloco ${r.bloco || 'H'}</td>
            <td>${veiculoDesc}</td>
            <td>${dataFmt}</td>
            <td>${horaFmt}</td>
            <td>
              <button class="btn btn-danger" onclick="cancelarAgendamentoBanco(${r.id})">
                Cancelar
              </button>
            </td>
          </tr>
        `;
      }).join('');
    })
    .catch(() => {
      table.innerHTML = '<tr><td colspan="6" class="empty">Falha ao carregar agendamentos do servidor.</td></tr>';
    });
}

window.cancelarAgendamentoBanco = function(id) {
  if (!confirm('Deseja realmente cancelar este agendamento?')) return;

  const usuario = localStorage.getItem('senaiUser') || '';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  fetch(`acoes.php?acao=cancelar_agendamento&id=${id}&usuario=${encodeURIComponent(usuario)}&id_usuario=${usuarioId}`)
    .then(r => r.json())
    .then(data => {
      if (!data.sucesso) {
        toast(data.mensagem || 'Você não tem permissão para cancelar este agendamento.');
        return;
      }
      toast('Agendamento cancelado com sucesso. A vaga física foi liberada!');
      liveSensor.reservado = false;
      liveSensor.agendamento = null;
      carregarMinhasVagas();
      pollSensor();
    })
    .catch(() => toast('Erro ao cancelar agendamento.'));
};

function markNoShow(id) {
  const rs = getReservations();
  const r = rs.find(x => x.id === id && x.active);
  if (!r) {
    toast('Agendamento não encontrado.');
    return;
  }
  r.active = false;
  r.status = 'no-show';
  r.noShowAt = new Date().toISOString();
  saveReservations(rs);

  const ss = getSanctions();
  const previous = ss.filter(x => x.user === r.user && !x.resolved).length;
  const level = previous + 1;

  let penalty = 'Advertência';
  if (level === 2) penalty = 'Bloqueio de 24h';
  if (level === 3) penalty = 'Bloqueio de 7 dias';
  if (level >= 4) penalty = 'Bloqueio de 30 dias';

  const newSanction = {
    id: ss.length + 1,
    reservationId: id,
    user: r.user,
    plate: r.plate,
    date: new Date().toISOString().slice(0, 10),
    reason: 'Não compareceu ao horário agendado',
    penalty,
    level,
    resolved: false
  };

  ss.push(newSanction);
  saveSanctions(ss);

  toast(`Ocorrência registrada para ${r.user} (${penalty}).`);
  setTimeout(() => location.reload(), 450);
}

function resolveSanction(id) {
  const ss = getSanctions();
  const s = ss.find(x => Number(x.id) === Number(id));
  if (!s) {
    toast('Ocorrência não encontrada.');
    return;
  }
  s.resolved = true;
  saveSanctions(ss);
  toast(`Ocorrência #${id} encerrada.`);
  setTimeout(() => location.reload(), 300);
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

function setupBlockSwitch() {
  document.querySelectorAll('[data-block]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-block]').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    renderMap(btn.dataset.block);
  }));

  const sel = document.getElementById('spotSelector');
  if (sel) {
    sel.addEventListener('change', e => onSpotSelectorChange(e.target.value));
  }
}

// =====================================================
// AUTENTICAÇÃO E SESSÃO DO USUÁRIO
// =====================================================
function setupLogin() {
  const isLoginPage = location.pathname.endsWith('/index.html') ||
                      location.pathname.endsWith('index.html') ||
                      location.pathname.endsWith('/esp/') ||
                      location.pathname.endsWith('/esp');

  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');
  const btnShowRegister = document.getElementById('btnShowRegister');
  const btnShowLogin = document.getElementById('btnShowLogin');
  const loginErro = document.getElementById('loginErro');
  const loginSucesso = document.getElementById('loginSucesso');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');

  // Alterna entre tela de Login e tela de Criação de Conta
  if (btnShowRegister && btnShowLogin && loginForm && regForm) {
    btnShowRegister.addEventListener('click', e => {
      e.preventDefault();
      loginForm.style.display = 'none';
      regForm.style.display = 'block';
      if (loginErro) loginErro.style.display = 'none';
      if (loginSucesso) loginSucesso.style.display = 'none';
      if (formTitle) formTitle.textContent = 'Criar nova conta';
      if (formSubtitle) formSubtitle.textContent = 'Preencha seus dados para acessar o sistema.';
    });

    btnShowLogin.addEventListener('click', e => {
      e.preventDefault();
      regForm.style.display = 'none';
      loginForm.style.display = 'block';
      if (loginErro) loginErro.style.display = 'none';
      if (loginSucesso) loginSucesso.style.display = 'none';
      if (formTitle) formTitle.textContent = 'Entrar no sistema';
      if (formSubtitle) formSubtitle.textContent = 'Acesse com seu usuário cadastrado no banco de dados.';
    });
  }

  // 1. Processa Formulário de Login
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const login = document.getElementById('login')?.value.trim();
      const senha = document.getElementById('senha')?.value.trim();

      if (!login || !senha) return;

      const btn = document.getElementById('btnLoginSubmit');
      if (btn) btn.disabled = true;

      const formData = new FormData();
      formData.append('usuario', login);
      formData.append('senha', senha);

      fetch('acoes.php?acao=login', {
        method: 'POST',
        body: formData
      })
        .then(r => r.json())
        .then(data => {
          if (btn) btn.disabled = false;
          if (data.sucesso) {
            localStorage.setItem('senaiUser', data.usuario.usuario);
            localStorage.setItem('senaiUserId', data.usuario.id);
            localStorage.setItem('senaiNome', data.usuario.nome);
            location.href = 'painel.html';
          } else {
            if (loginErro) {
              loginErro.textContent = data.mensagem || 'Usuário ou senha incorretos.';
              loginErro.style.display = 'block';
            } else {
              alert(data.mensagem || 'Usuário ou senha incorretos.');
            }
          }
        })
        .catch(() => {
          if (btn) btn.disabled = false;
          if (loginErro) {
            loginErro.textContent = 'Erro de comunicação com o servidor MySQL.';
            loginErro.style.display = 'block';
          }
        });
    });
  }

  // 2. Processa Formulário de Cadastro
  if (regForm) {
    regForm.addEventListener('submit', e => {
      e.preventDefault();
      const nome = document.getElementById('regNome')?.value.trim();
      const usuario = document.getElementById('regUsuario')?.value.trim();
      const senha = document.getElementById('regSenha')?.value.trim();
      const confirma = document.getElementById('regConfirma')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();

      if (!nome || !usuario || !senha) return;

      if (senha !== confirma) {
        if (loginErro) {
          loginErro.textContent = 'As senhas digitadas não coincidem.';
          loginErro.style.display = 'block';
        }
        return;
      }

      const btn = document.getElementById('btnRegSubmit');
      if (btn) btn.disabled = true;

      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('usuario', usuario);
      if (email) formData.append('email', email);
      formData.append('senha', senha);
      formData.append('confirma_senha', confirma);

      fetch('acoes.php?acao=cadastrar_usuario', {
        method: 'POST',
        body: formData
      })
        .then(r => r.json())
        .then(data => {
          if (btn) btn.disabled = false;
          if (data.sucesso) {
            localStorage.setItem('senaiUser', data.usuario.usuario);
            localStorage.setItem('senaiUserId', data.usuario.id);
            localStorage.setItem('senaiNome', data.usuario.nome);
            location.href = 'painel.html';
          } else {
            if (loginErro) {
              loginErro.textContent = data.mensagem || 'Erro ao criar conta.';
              loginErro.style.display = 'block';
            }
          }
        })
        .catch(() => {
          if (btn) btn.disabled = false;
          if (loginErro) {
            loginErro.textContent = 'Erro ao cadastrar no banco de dados.';
            loginErro.style.display = 'block';
          }
        });
    });
  }

  // Se não estiver na tela de login, valida e atualiza o crachá do usuário no topo
  if (!isLoginPage) {
    const usuarioLogado = localStorage.getItem('senaiUser');
    const nomeLogado = localStorage.getItem('senaiNome') || usuarioLogado;

    if (!usuarioLogado) {
      location.href = 'index.html';
      return;
    }

    const badgeName = document.getElementById('userBadgeName');
    const badgeIcon = document.getElementById('userBadgeIcon');
    if (badgeName) {
      badgeName.textContent = nomeLogado || 'Usuário';
    }
    if (badgeIcon && nomeLogado) {
      badgeIcon.textContent = nomeLogado.charAt(0).toUpperCase();
    }
  }
}

window.fazerLogout = function() {
  fetch('acoes.php?acao=logout')
    .finally(() => {
      localStorage.removeItem('senaiUser');
      localStorage.removeItem('senaiUserId');
      localStorage.removeItem('senaiNome');
      location.href = 'index.html';
    });
};

// =====================================================
// GERENCIAMENTO DE TEMA (MODO ESCURO / CLARO)
// =====================================================
function inicializarTema() {
  const temaSalvo = localStorage.getItem('senaiTheme');
  const isDark = temaSalvo === 'dark';

  if (isDark) {
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
  }

  const btnToggle = document.getElementById('themeToggle');
  if (btnToggle) {
    btnToggle.innerHTML = isDark ? '☀️' : '🌙';
    btnToggle.setAttribute('title', isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro');
  }
}

window.alternarTema = function() {
  const isDark = document.body.classList.toggle('dark-mode');
  document.documentElement.classList.toggle('dark-mode', isDark);
  localStorage.setItem('senaiTheme', isDark ? 'dark' : 'light');

  const btnToggle = document.getElementById('themeToggle');
  if (btnToggle) {
    btnToggle.innerHTML = isDark ? '☀️' : '🌙';
    btnToggle.setAttribute('title', isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro');
  }
};

// =====================================================
// PERFIL DO USUÁRIO, E-MAILS & GERENCIAMENTO DE CONTA
// =====================================================
let perfilCache = null;
let perfilSenhaVisivel = false;

function carregarPerfilUsuario() {
  const container = document.querySelector('.profile-container');
  if (!container) return;

  const usuario = localStorage.getItem('senaiUser') || '';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  if (!usuario && usuarioId <= 0) return;

  fetch(`acoes.php?acao=obter_perfil&usuario=${encodeURIComponent(usuario)}&id_usuario=${usuarioId}`)
    .then(r => r.json())
    .then(data => {
      if (!data || !data.sucesso || (!data.perfil && !data.usuario)) {
        toast('Não foi possível carregar as informações do perfil.');
        return;
      }

      const p = data.perfil || data.usuario;
      if (data.total_veiculos !== undefined) p.total_veiculos = data.total_veiculos;
      if (data.total_agendamentos !== undefined) p.total_agendamentos = data.total_agendamentos;
      perfilCache = p;

      // Hero
      const avatarEl = document.getElementById('perfilHeroAvatar');
      const heroNomeEl = document.getElementById('perfilHeroNome');
      const heroLoginEl = document.getElementById('perfilHeroLogin');
      const heroBadgeEl = document.getElementById('perfilHeroMembroBadge');

      const inicial = (p.nome || p.usuario || 'U').charAt(0).toUpperCase();
      if (avatarEl) avatarEl.textContent = inicial;
      if (heroNomeEl) heroNomeEl.textContent = p.nome || p.usuario;
      if (heroLoginEl) heroLoginEl.textContent = `@${p.usuario}`;

      // Data de criação
      let dataFormatada = 'Data não registrada';
      let dataCurta = '—';
      let diasTexto = '—';

      if (p.criado_em) {
        const dataObj = new Date(p.criado_em.replace(' ', 'T'));
        if (!isNaN(dataObj.getTime())) {
          dataFormatada = dataObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          dataCurta = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

          const hoje = new Date();
          const diffMs = hoje.getTime() - dataObj.getTime();
          const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDias <= 0) {
            diasTexto = 'Hoje (1º dia)';
          } else if (diffDias === 1) {
            diasTexto = '1 dia';
          } else {
            diasTexto = `${diffDias} dias`;
          }
        }
      }

      if (heroBadgeEl) heroBadgeEl.textContent = `Membro desde ${dataCurta}`;

      // Cards de estatísticas
      const diasEl = document.getElementById('perfilDiasMembro');
      const membroDesdeCurtoEl = document.getElementById('perfilMembroDesdeCurto');
      const totalVeiculosEl = document.getElementById('perfilTotalVeiculos');
      const totalAgendamentosEl = document.getElementById('perfilTotalAgendamentos');

      if (diasEl) diasEl.textContent = diasTexto;
      if (membroDesdeCurtoEl) membroDesdeCurtoEl.textContent = `Desde ${dataCurta}`;
      if (totalVeiculosEl) totalVeiculosEl.textContent = p.total_veiculos || 0;
      if (totalAgendamentosEl) totalAgendamentosEl.textContent = p.total_agendamentos || 0;

      // Seção de Informações
      const nomeEl = document.getElementById('perfilNome');
      const usuarioEl = document.getElementById('perfilUsuario');
      const emailEl = document.getElementById('perfilEmail');
      const criadoEmEl = document.getElementById('perfilCriadoEm');
      const senhaDisplayEl = document.getElementById('perfilSenhaDisplay');

      if (nomeEl) nomeEl.textContent = p.nome || '—';
      if (usuarioEl) usuarioEl.textContent = p.usuario || '—';
      if (emailEl) emailEl.textContent = p.email || (p.usuario + '@senai.br');
      if (criadoEmEl) criadoEmEl.textContent = `${dataFormatada} (${diasTexto})`;
      if (senhaDisplayEl) senhaDisplayEl.textContent = '••••••••';
      perfilSenhaVisivel = false;

      // Modal de exclusão
      const modalNome = document.getElementById('modalExclusaoNome');
      const modalUser = document.getElementById('modalExclusaoUsuario');
      if (modalNome) modalNome.textContent = p.nome || p.usuario;
      if (modalUser) modalUser.textContent = `@${p.usuario}`;

      // Carrega notificações / e-mails
      carregarNotificacoesUsuario(false);
    })
    .catch(() => {
      toast('Erro ao buscar dados do perfil no servidor.');
    });
}

window.alternarExibicaoSenha = function() {
  const displayEl = document.getElementById('perfilSenhaDisplay');
  const btnEl = document.getElementById('btnToggleSenha');
  if (!displayEl || !perfilCache) return;

  perfilSenhaVisivel = !perfilSenhaVisivel;
  if (perfilSenhaVisivel) {
    displayEl.textContent = perfilCache.senha || '—';
    if (btnEl) btnEl.innerHTML = '🔒 Ocultar senha';
  } else {
    displayEl.textContent = '••••••••';
    if (btnEl) btnEl.innerHTML = '👁 Ver senha';
  }
};

window.toggleEditarEmail = function() {
  const form = document.getElementById('formAtualizarEmail');
  const input = document.getElementById('novoEmailInput');
  const span = document.getElementById('perfilEmail');
  if (!form) return;

  const estaVisivel = form.style.display !== 'none';
  if (estaVisivel) {
    form.style.display = 'none';
  } else {
    form.style.display = 'block';
    if (input && span) {
      input.value = span.textContent !== '—' ? span.textContent : '';
      input.focus();
    }
  }
};

window.salvarNovoEmail = function(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('novoEmailInput');
  const novoEmail = input?.value.trim();

  if (!novoEmail) {
    toast('Digite um e-mail válido.');
    return;
  }

  const usuario = localStorage.getItem('senaiUser') || '';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  const fd = new FormData();
  fd.append('id_usuario', usuarioId);
  fd.append('usuario', usuario);
  fd.append('email', novoEmail);

  fetch('acoes.php?acao=atualizar_email', {
    method: 'POST',
    body: fd
  })
    .then(r => r.json())
    .then(data => {
      if (data.sucesso) {
        toast(data.mensagem || 'E-mail atualizado com sucesso!');
        const span = document.getElementById('perfilEmail');
        if (span) span.textContent = novoEmail;
        toggleEditarEmail();
        carregarNotificacoesUsuario(false);
      } else {
        toast(data.mensagem || 'Erro ao atualizar e-mail.');
      }
    })
    .catch(() => toast('Erro de comunicação com o servidor.'));
};

// =====================================================
// CENTRAL DE NOTIFICAÇÕES & E-MAILS
// =====================================================
function carregarNotificacoesUsuario(abrirModal) {
  const usuario = localStorage.getItem('senaiUser') || '';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  fetch(`acoes.php?acao=obter_notificacoes&usuario=${encodeURIComponent(usuario)}&id_usuario=${usuarioId}`)
    .then(r => r.json())
    .then(data => {
      const notifs = data.notificacoes || [];
      const badgeCount = document.getElementById('notificacoesCount');
      if (badgeCount) badgeCount.textContent = notifs.length;

      const container = document.getElementById('listaNotificacoesEmail');
      if (container) {
        if (!notifs.length) {
          container.innerHTML = `<div style="text-align:center; padding:36px; color:var(--muted);">Nenhum e-mail ou notificação gerada até o momento.</div>`;
        } else {
          container.innerHTML = notifs.map(n => {
            const dataHora = n.criado_em ? new Date(n.criado_em.replace(' ', 'T')).toLocaleString('pt-BR') : 'Data não registrada';
            return `
              <div class="email-item">
                <div class="email-item-header">
                  <span><strong>Para:</strong> ${n.destinatario}</span>
                  <span>${dataHora}</span>
                </div>
                <div class="email-item-subject">
                  <span>📧</span> ${n.assunto}
                </div>
                <div class="email-item-body">
                  ${n.mensagem}
                </div>
              </div>
            `;
          }).join('');
        }
      }

      if (abrirModal) {
        const modal = document.getElementById('modalNotificacoes');
        if (modal) modal.classList.add('active');
      }
    })
    .catch(() => {});
}

window.abrirModalNotificacoes = function() {
  carregarNotificacoesUsuario(true);
};

window.fecharModalNotificacoes = function() {
  const modal = document.getElementById('modalNotificacoes');
  if (modal) modal.classList.remove('active');
};

// =====================================================
// MODAL PROFISSIONAL DE EXCLUSÃO DE CONTA
// =====================================================
window.abrirModalExclusao = function() {
  const modal = document.getElementById('modalExclusaoConta');
  const check = document.getElementById('checkConfirmaExclusao');
  const inputSenha = document.getElementById('senhaConfirmacaoExclusao');
  const btn = document.getElementById('btnExcluirConta');
  const icon = document.getElementById('btnExcluirIcon');

  if (check) check.checked = false;
  if (inputSenha) inputSenha.value = '';
  if (btn) btn.disabled = true;
  if (icon) icon.textContent = '🔒';

  if (modal) modal.classList.add('active');
  if (inputSenha) setTimeout(() => inputSenha.focus(), 150);
};

window.fecharModalExclusao = function() {
  const modal = document.getElementById('modalExclusaoConta');
  if (modal) modal.classList.remove('active');
};

function configurarFormularioAlterarSenha() {
  const form = document.getElementById('formAlterarSenha');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const senhaAtual = document.getElementById('senhaAtual')?.value.trim();
    const novaSenha = document.getElementById('novaSenha')?.value.trim();
    const confirmaNova = document.getElementById('confirmaNovaSenha')?.value.trim();

    if (!senhaAtual || !novaSenha || !confirmaNova) {
      toast('Preencha todos os campos de senha.');
      return;
    }

    if (novaSenha !== confirmaNova) {
      toast('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (novaSenha.length < 4) {
      toast('A nova senha deve conter pelo menos 4 caracteres.');
      return;
    }

    const usuario = localStorage.getItem('senaiUser') || '';
    const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;
    const btn = document.getElementById('btnSalvarSenha');
    if (btn) btn.disabled = true;

    const fd = new FormData();
    fd.append('id_usuario', usuarioId);
    fd.append('usuario', usuario);
    fd.append('senha_atual', senhaAtual);
    fd.append('nova_senha', novaSenha);

    fetch('acoes.php?acao=alterar_senha', {
      method: 'POST',
      body: fd
    })
      .then(r => r.json())
      .then(data => {
        if (btn) btn.disabled = false;
        if (data.sucesso) {
          toast(data.mensagem || 'Senha alterada com sucesso!');
          form.reset();
          if (perfilCache) {
            perfilCache.senha = novaSenha;
            if (perfilSenhaVisivel) {
              const displayEl = document.getElementById('perfilSenhaDisplay');
              if (displayEl) displayEl.textContent = novaSenha;
            }
          }
          carregarNotificacoesUsuario(false);
        } else {
          toast(data.mensagem || 'Erro ao alterar senha.');
        }
      })
      .catch(() => {
        if (btn) btn.disabled = false;
        toast('Erro de comunicação ao atualizar senha.');
      });
  });
}

function configurarExclusaoConta() {
  const check = document.getElementById('checkConfirmaExclusao');
  const inputSenha = document.getElementById('senhaConfirmacaoExclusao');
  const btnExcluir = document.getElementById('btnExcluirConta');
  const icon = document.getElementById('btnExcluirIcon');

  if (!check || !inputSenha || !btnExcluir) return;

  const validarCampos = () => {
    const aceitou = check.checked;
    const senhaPreenchida = inputSenha.value.trim().length > 0;
    const liberado = aceitou && senhaPreenchida;
    btnExcluir.disabled = !liberado;
    if (icon) icon.textContent = liberado ? '🗑' : '🔒';
  };

  check.addEventListener('change', validarCampos);
  inputSenha.addEventListener('input', validarCampos);

  btnExcluir.addEventListener('click', () => {
    if (!check.checked) {
      toast('Você precisa marcar a caixa confirmando a exclusão.');
      return;
    }
    const senha = inputSenha.value.trim();
    if (!senha) {
      toast('Digite sua senha para confirmar.');
      inputSenha.focus();
      return;
    }

    btnExcluir.disabled = true;
    btnExcluir.textContent = 'Apagando conta...';

    const usuario = localStorage.getItem('senaiUser') || '';
    const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

    const fd = new FormData();
    fd.append('id_usuario', usuarioId);
    fd.append('usuario', usuario);
    fd.append('senha', senha);
    fd.append('aceitou', '1');

    fetch('acoes.php?acao=excluir_conta', {
      method: 'POST',
      body: fd
    })
      .then(r => r.json())
      .then(data => {
        if (data.sucesso) {
          alert('Sua conta foi excluída com sucesso do sistema SENAI Parking.');
          localStorage.clear();
          location.href = 'index.html';
        } else {
          btnExcluir.disabled = false;
          btnExcluir.innerHTML = '<span id="btnExcluirIcon">🗑</span> Sim, apagar minha conta';
          toast(data.mensagem || 'Senha incorreta ou erro ao excluir conta.');
        }
      })
      .catch(() => {
        btnExcluir.disabled = false;
        btnExcluir.innerHTML = '<span id="btnExcluirIcon">🗑</span> Sim, apagar minha conta';
        toast('Erro de comunicação com o servidor.');
      });
  });
}

// =====================================================
// SINCRONIZAÇÃO EM TEMPO REAL E MÉTRICAS
// =====================================================
function atualizarMetricasGerais() {
  const usuario = localStorage.getItem('senaiUser') || '';
  const usuarioId = Number(localStorage.getItem('senaiUserId')) || 0;

  // Consulta agendamentos no MySQL para métricas exatas
  fetch(`acoes.php?acao=obter_agendamentos&usuario=${encodeURIComponent(usuario)}&id_usuario=${usuarioId}`)
    .then(r => r.json())
    .then(minhasReservas => {
      const totalMinhas = Array.isArray(minhasReservas) ? minhasReservas.length : 0;
      document.querySelectorAll('[data-reservas]').forEach(el => el.textContent = totalMinhas);
    })
    .catch(() => {});

  const stats = { green: 0, red: 0, yellow: 0 };
  allSpots().forEach(s => stats[statusFor(s)]++);
  document.querySelectorAll('[data-stat=green]').forEach(e => e.textContent = stats.green);
  document.querySelectorAll('[data-stat=red]').forEach(e => e.textContent = stats.red);
  document.querySelectorAll('[data-stat=yellow]').forEach(e => e.textContent = stats.yellow);
}

function pollSensor() {
  fetch('acoes.php?acao=status')
    .then(res => res.json())
    .then(data => {
      if (!data || data.erro) return;
      liveSensor = data;

      atualizarMetricasGerais();

      const sel = document.getElementById('spotSelector');
      if (sel) {
        const spotId = sel.value || (parkingBlocks[currentBlock]?.spots[0] ? parkingBlocks[currentBlock].spots[0][0] : '');
        if (spotId) {
          const st = statusFor([spotId, 'green']);
          // Atualiza as opções do select e os cards visuais das vagas
          parkingBlocks[currentBlock]?.spots?.forEach(sp => {
            const spId = sp[0];
            const spSt = statusFor([spId, 'green']);
            const spOpt = sel.querySelector(`option[value="${spId}"]`);
            if (spOpt) {
              const spLabel = spSt === 'green' ? 'Livre' : spSt === 'red' ? 'Ocupada' : 'Agendada';
              const spColor = spSt === 'green' ? 'var(--green)' : spSt === 'red' ? 'var(--red)' : 'var(--yellow)';
              spOpt.textContent = `${spId} — ${spLabel}`;
              spOpt.className = `spot-option ${spSt}`;
              spOpt.style.color = spColor;
            }

            // Atualiza card visual esquemático em tempo real
            const bayEl = document.getElementById('bayCard_' + spId.replace(/\s+/g, '_'));
            if (bayEl) {
              bayEl.className = `bay-card bay-${spSt} ${(selected && selected.s[0] === spId) ? 'selected' : ''}`;
              const ind = bayEl.querySelector('.bay-indicator');
              if (ind) {
                ind.className = `bay-indicator ${spSt}`;
                const spLabel = spSt === 'green' ? 'Livre' : spSt === 'red' ? 'Ocupada' : 'Agendada';
                ind.innerHTML = `<i class="i-${spSt}"></i> ${spLabel}`;
              }
            }
          });

          setSelectorStatusColor(sel, st);

          const distEl = document.getElementById('sensorDistance');
          const ledEl = document.getElementById('sensorLed');
          if (distEl) {
            const vObj = liveSensor?.vagas?.[spotId];
            const dVal = (vObj && vObj.distancia > 0) ? vObj.distancia : (spotId === 'Vaga 01' ? liveSensor.distancia : 0);
            distEl.textContent = liveSensor.online ? (dVal > 0 ? `${dVal.toFixed(1)} cm` : 'Sem leitura') : 'Desconectado';
          }
          if (ledEl) {
            ledEl.textContent = st === 'green' ? 'Verde (Livre)' : st === 'red' ? 'Vermelho (Ocupada)' : 'Amarelo (Agendada)';
          }

          const curAgendId = liveSensor?.vagas?.[spotId]?.agendamento?.id || (spotId === 'Vaga 01' ? liveSensor?.agendamento?.id : null);
          if (st !== lastKnownStatus || (st === 'yellow' && (!document.getElementById('metaAgendamentoBox') || curAgendId !== window._lastAgendamentoId))) {
            lastKnownStatus = st;
            window._lastAgendamentoId = curAgendId;
            showSelectedFromSelector(spotId, currentBlock);
          }
        }
      }
    })
    .catch(() => {});
}

function pageInit() {
  inicializarTema();
  setupLogin();
  setupBlockSwitch();
  inicializarDadosVeiculos();
  configurarFormularioVeiculos();
  mostrarMeuVeiculo();
  carregarMinhasVagas();
  carregarPerfilUsuario();
  configurarFormularioAlterarSenha();
  configurarExclusaoConta();

  const map = document.getElementById('map');
  if (map) {
    document.querySelectorAll('[data-block]').forEach(btn => {
      btn.classList.remove('active');
    });

    const hButton = document.querySelector('[data-block="H"]');
    if (hButton) {
      hButton.classList.add('active');
    }

    document.querySelectorAll('[data-block]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.block === currentBlock);
    });

    renderMap(currentBlock);
  }

  atualizarMetricasGerais();
  pollSensor();
  setInterval(pollSensor, 3000);

  const sanctionTable = document.getElementById('sanctionTable');
  if (sanctionTable) {
    const ss = getSanctions();
    sanctionTable.innerHTML = ss.length
      ? ss.slice().reverse().map(s => `
          <tr>
            <td><strong>#${s.id}</strong></td>
            <td>${s.reservationId}</td>
            <td>${s.date}</td>
            <td>${s.reason}</td>
            <td><span class="badge ${s.resolved ? 'green' : 'red'}">${s.resolved ? 'Encerrada' : s.penalty}</span></td>
            <td>${s.resolved ? '—' : `<button class="btn btn-light" onclick="resolveSanction('${s.id}')">Encerrar</button>`}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" class="empty">Nenhuma ocorrência registrada.</td></tr>`;
  }

  const sanctionCount = getSanctions().filter(s => !s.resolved).length;
  document.querySelectorAll('[data-sancoes]').forEach(e => e.textContent = sanctionCount);

  const noShowWrap = document.getElementById('noShowList');
  if (noShowWrap) {
    const reservations = getReservations();
    const active = reservations.filter(r => r.active);
    noShowWrap.innerHTML = active.length
      ? active.map(r => `
          <div class="list-item">
            <div>
              <strong>${r.id} • ${(parkingBlocks[r.block]?.name || r.block)}</strong>
              <div style="font-size:12px;color:var(--muted)">${r.date} às ${r.time || '—'} • ${r.user}</div>
            </div>
            <button class="btn btn-danger" onclick="markNoShow('${r.id}')">Marcar não comparecimento</button>
          </div>
        `).join('')
      : `<div class="empty">Nenhum agendamento ativo para registrar ocorrência.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', pageInit);


function selecionarVagaPeloCard(spotId) {
  const sel = document.getElementById('spotSelector');
  if (sel) {
    sel.value = spotId;
    updateSelectorStatus(spotId, currentBlock);
    showSelectedFromSelector(spotId, currentBlock);
    document.querySelectorAll('.bay-card').forEach(c => c.classList.remove('selected'));
    const card = document.getElementById('bayCard_' + spotId.replace(/\s+/g, '_'));
    if (card) card.classList.add('selected');
  }
}
