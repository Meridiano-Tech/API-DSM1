create database if not exists faleconosco;

use faleconosco;

create table if not exists contatos ( 
  cont_id int auto_increment primary key,
  cont_nome varchar(100) not null,
  cont_email varchar(150) not null,
  cont_mensagem varchar(1200),
  cont_data_envio timestamp default current_timestamp
);