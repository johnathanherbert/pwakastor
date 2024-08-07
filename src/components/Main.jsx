import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Typography, AppBar, Toolbar, IconButton, Container, Grid, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Main = () => {
  const [ordens, setOrdens] = useState([]);
  const [ativo, setAtivo] = useState('');
  const [excipientes, setExcipientes] = useState({});
  const [editingOrdem, setEditingOrdem] = useState(null);
  const [expandedExcipient, setExpandedExcipient] = useState(null);
  const [editingExcipiente, setEditingExcipiente] = useState({});

  const handleAddOrdem = async () => {
    const { data, error } = await supabase
      .from('DataBase_nmed')
      .select('*')
      .eq('Codigo_Receita', ativo);

    if (error) {
      alert(error.message);
    } else if (data.length > 0) {
      const newOrdens = [...ordens, { codigo: ativo, nome: data[0].Ativo }];
      setOrdens(newOrdens);
      calcularExcipientes(newOrdens);
    } else {
      alert('Receita não encontrada');
    }
  };

  const handleRemoveOrdem = (index) => {
    const newOrdens = [...ordens];
    newOrdens.splice(index, 1);
    setOrdens(newOrdens);
    calcularExcipientes(newOrdens);
  };

  const handleEditOrdem = (index) => {
    setEditingOrdem(ordens[index]);
    fetchOrdemExcipientes(ordens[index].codigo);
  };

  const handleCloseEdit = () => {
    setEditingOrdem(null);
    setEditingExcipiente({});
  };

  const handleSaveEdit = () => {
    const updatedOrdens = ordens.map((ordem) =>
      ordem.codigo === editingOrdem.codigo ? { ...ordem, excipientes: editingExcipiente } : ordem
    );
    setOrdens(updatedOrdens);
    handleCloseEdit();
  };

  const handleUpdateTotal = () => {
    calcularExcipientes(ordens);
  };

  const fetchOrdemExcipientes = async (codigo) => {
    const { data, error } = await supabase
      .from('DataBase_nmed')
      .select('Excipiente, qtd_materia_prima')
      .eq('Codigo_Receita', codigo);

    if (error) {
      alert(error.message);
      return;
    }

    const excipientesData = data.reduce((acc, item) => {
      acc[item.Excipiente] = item.qtd_materia_prima;
      return acc;
    }, {});

    setEditingExcipiente(excipientesData);
  };

  const handleExcipientChange = (excipient, value) => {
    setEditingExcipiente({ ...editingExcipiente, [excipient]: parseFloat(value) });
  };

  const handleRemoveExcipient = (excipient) => {
    const { [excipient]: _, ...rest } = editingExcipiente;
    setEditingExcipiente(rest);
  };

  const handleToggleExpandExcipient = (excipient) => {
    setExpandedExcipient(expandedExcipient === excipient ? null : excipient);
  };

  const calcularExcipientes = async (ordens) => {
    if (ordens.length === 0) {
      setExcipientes({});
      return;
    }

    let newExcipientes = {};

    for (let ordem of ordens) {
      const { data, error } = await supabase
        .from('DataBase_nmed')
        .select('Excipiente, qtd_materia_prima')
        .eq('Codigo_Receita', ordem.codigo);

      if (error) {
        alert(error.message);
        return;
      }

      data.forEach((item) => {
        if (!newExcipientes[item.Excipiente]) {
          newExcipientes[item.Excipiente] = { total: 0, ordens: [] };
        }
        newExcipientes[item.Excipiente].total += item.qtd_materia_prima;
        newExcipientes[item.Excipiente].ordens.push({ codigo: ordem.codigo, quantidade: item.qtd_materia_prima, nome: ordem.nome });
      });
    }

    setExcipientes(newExcipientes);
  };

  // Função de teste de conexão
  const testConnection = async () => {
    const { data, error } = await supabase
      .from('DataBase_nmed')
      .select('*')
      .limit(1);

    console.log('Teste de conexão:', data, error);
  };

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    calcularExcipientes(ordens);
  }, [ordens]);

  const chartData = {
    labels: Object.keys(excipientes),
    datasets: [
      {
        label: 'Quantidade de Excipientes',
        data: Object.values(excipientes).map(item => item.total),
        backgroundColor: Object.keys(excipientes).map((_, index) =>
          `rgba(${(index * 50) % 255}, ${(index * 100) % 255}, ${(index * 150) % 255}, 0.6)`
        ),
        borderColor: Object.keys(excipientes).map((_, index) =>
          `rgba(${(index * 50) % 255}, ${(index * 100) % 255}, ${(index * 150) % 255}, 1)`
        ),
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container>
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="logo">
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, color: '#fff' }}>
            Pesagem - Abastecimento
          </Typography>
        </Toolbar>
      </AppBar>

      <Typography variant="h4" gutterBottom sx={{ color: '#333' }}>
        Gestão de Ordens
      </Typography>
      <TextField
        label="Código Receita"
        variant="outlined"
        value={ativo}
        onChange={(e) => setAtivo(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleAddOrdem} fullWidth sx={{ mb: 2 }}>
        Adicionar Ordem
      </Button>

      <Button variant="contained" color="secondary" onClick={handleUpdateTotal} sx={{ mb: 2 }}>
        Atualizar Tabela Total
      </Button>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ color: '#444' }}>
            Ordens Adicionadas
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordens.map((ordem, index) => (
                  <TableRow key={index}>
                    <TableCell>{ordem.codigo}</TableCell>
                    <TableCell>{ordem.nome}</TableCell>
                    <TableCell>
                      <Button variant="outlined" color="error" onClick={() => handleRemoveOrdem(index)}>
                        Remover
                      </Button>
                      <Button variant="outlined" color="primary" onClick={() => handleEditOrdem(index)} sx={{ ml: 1 }}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ color: '#444' }}>
            Somatória de Excipientes
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Excipiente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Quantidade Total (Kg)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(excipientes).map(([nome, { total, ordens }]) => (
                  <React.Fragment key={nome}>
                    <TableRow onClick={() => handleToggleExpandExcipient(nome)}>
                      <TableCell sx={{ color: '#1976d2', cursor: 'pointer' }}>{nome}</TableCell>
                      <TableCell>{total.toFixed(2)} Kg</TableCell>
                    </TableRow>
                    {expandedExcipient === nome && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Código Ordem</TableCell>
                                <TableCell>Nome Ativo</TableCell>
                                <TableCell>Quantidade (Kg)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ordens.map(({ codigo, nome, quantidade }) => (
                                <TableRow key={codigo}>
                                  <TableCell>{codigo}</TableCell>
                                  <TableCell>{nome}</TableCell>
                                  <TableCell>{quantidade.toFixed(2)} Kg</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={6}>
          <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '20px' }}>
            <Typography variant="h6" sx={{ color: '#444' }}>
              Consumo de Excipientes
            </Typography>
            <div style={{ height: '400px' }}>
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </Grid>
      </Grid>

      <Dialog open={!!editingOrdem} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Editar Ordem</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ color: '#333' }}>
            Código: {editingOrdem?.codigo}
          </Typography>
          <Typography variant="h6" sx={{ color: '#333' }}>
            Nome: {editingOrdem?.nome}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Excipiente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Quantidade (Kg)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(editingExcipiente).map(([excipient, value]) => (
                  <TableRow key={excipient}>
                    <TableCell>{excipient}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={value}
                        onChange={(e) => handleExcipientChange(excipient, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" color="error" onClick={() => handleRemoveExcipient(excipient)}>
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSaveEdit} color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Main;
