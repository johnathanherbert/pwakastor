import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Typography, AppBar, Container } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Main = () => {
  const [ordens, setOrdens] = useState([]);
  const [ativo, setAtivo] = useState('');
  const [excipientes, setExcipientes] = useState({});

  const handleAddOrdem = async () => {
    console.log(`Buscando ativo para o código de receita: ${ativo}`);
    const { data, error } = await supabase
      .from('DataBase_nmed')
      .select('*')
      .eq('Codigo_Receita', ativo);

    console.log('Resultado da consulta:', data, error);

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

  const calcularExcipientes = async (ordens) => {
    if (ordens.length === 0) {
      setExcipientes({});
      return;
    }

    let newExcipientes = {};

    for (let ordem of ordens) {
      console.log(`Calculando excipientes para a ordem: ${ordem.codigo}`);
      const { data, error } = await supabase
        .from('DataBase_nmed')
        .select('Excipiente, qtd_materia_prima')
        .eq('Codigo_Receita', ordem.codigo);

      console.log(`Resultado da consulta para ${ordem.codigo}:`, data, error);

      if (error) {
        alert(error.message);
        return;
      }

      data.forEach((item) => {
        newExcipientes[item.Excipiente] = (newExcipientes[item.Excipiente] || 0) + item.qtd_materia_prima;
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
        data: Object.values(excipientes),
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

  const totalExcipientes = Object.entries(excipientes).reduce((acc, [nome, quantidade]) => {
    acc[nome] = (acc[nome] || 0) + quantidade;
    return acc;
  }, {});

  return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Gestão de Ordens
        </Typography>
        <TextField
          label="Código Receita"
          variant="outlined"
          value={ativo}
          onChange={(e) => setAtivo(e.target.value)}
          style={{ marginBottom: '20px', width: '100%' }}
        />
        <Button variant="contained" color="primary" onClick={handleAddOrdem}>
          Adicionar Ordem
        </Button>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', marginTop: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <Typography variant="h6" gutterBottom>
                Ordens Adicionadas
              </Typography>
              <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Nome</TableCell>
                      <TableCell>Ações</TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <div>
              <Typography variant="h6" gutterBottom>
                Consumo total dos Excipientes
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Excipiente</TableCell>
                      <TableCell>Quantidade Total (Kg)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(totalExcipientes).map(([nome, quantidade]) => (
                      <TableRow key={nome}>
                        <TableCell>{nome}</TableCell>
                        <TableCell>{quantidade.toFixed(2)} Kg</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '20px' }}>
              <Typography variant="h6" gutterBottom>
                Consumo de Excipientes
              </Typography>
              <div style={{ height: '400px' }}>
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Main;
