import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<App />, document.getElementById('root'));

class Cell extends React.Component {
    
  getValue() {
    const {value} = this.props;
    if (!value.isShown) {
      return this.props.value.isFlagged ? "🚩" : null;
    }
    if (value.isaMine) {
      return "💣";
    }
    if (value.neighbour === 0) {
      return null;
    }
    return value.neighbour;
  }

  render() {
    const {value, onClick, cMenu} = this.props;
    let className =
      "cell" +
      (value.isShown ? "" : " hidden") +
      (value.isaMine ? " is-mine" : "") +
      (value.isFlagged ? " is-flag" : "");

    return (
      <div
        onClick={onClick}
        className={className}
        onContextMenu={cMenu}
      >{this.getValue()}</div>
    );
  }
}

// Board Class
class Board extends React.Component {
  state = {
        boardData: this.initBoardData(this.props.height, this.props.width, this.props.mines),
        gameStatus: "Game in progress",
        mineCount: this.props.mines,
    };

    /* Helper Functions */

    // get mines
    getMines(data) {
        let mineArray = [];

        data.map(datarow => {
            datarow.map((dataitem) => {
                if (dataitem.isaMine) {
                    mineArray.push(dataitem);
                }
            });
        });

        return mineArray;
    }

    // get Flags
    getFlags(data) {
        let mineArray = [];

        data.map(datarow => {
            datarow.map((dataitem) => {
                if (dataitem.isFlagged) {
                    mineArray.push(dataitem);
                }
            });
        });

        return mineArray;
    }

    // get Hidden cells
    getHidden(data) {
        let mineArray = [];

        data.map(datarow => {
            datarow.map((dataitem) => {
                if (!dataitem.isShown) {
                    mineArray.push(dataitem);
                }
            });
        });

        return mineArray;
    }

    // get random number given a dimension
    getRandomNumber(dimension) {
        // return Math.floor(Math.random() * dimension);
        return Math.floor((Math.random() * 1000) + 1) % dimension;
    }

    // Gets initial board data
    initBoardData(height, width, mines) {
        let data = this.createEmptyArray(height, width);
        data = this.plantMines(data, height, width, mines);
        data = this.getNeighbours(data, height, width);
        return data;
    }
    createEmptyArray(height, width) {
        let data = [];

        for (let i = 0; i < height; i++) {
            data.push([]);
            for (let j = 0; j < width; j++) {
                data[i][j] = {
                    x: i,
                    y: j,
                    isaMine: false,
                    neighbour: 0,
                    isShown: false,
                    isEmpty: false,
                    isFlagged: false,
                };
            }
        }
        return data;
    }

    // plant mines on the board
    plantMines(data, height, width, mines) {
        let randomx, randomy, minesPlanted = 0;

        while (minesPlanted < mines) {
            randomx = this.getRandomNumber(width);
            randomy = this.getRandomNumber(height);
            if (!(data[randomx][randomy].isaMine)) {
                data[randomx][randomy].isaMine = true;
                minesPlanted++;
            }
        }

        return (data);
    }

    // get number of neighbouring mines for each board cell
    getNeighbours(data, height, width) {
        let updatedData = data, index = 0;

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (data[i][j].isaMine !== true) {
                    let mine = 0;
                    const area = this.traverseBoard(data[i][j].x, data[i][j].y, data);
                    area.map(value => {
                        if (value.isaMine) {
                            mine++;
                        }
                    });
                    if (mine === 0) {
                        updatedData[i][j].isEmpty = true;
                    }
                    updatedData[i][j].neighbour = mine;
                }
            }
        }

        return (updatedData);
    };

    // looks for neighbouring cells and returns them
    traverseBoard(x, y, data) {
        const el = [];

        //up
        if (x > 0) {
            el.push(data[x - 1][y]);
        }

        //down
        if (x < this.props.height - 1) {
            el.push(data[x + 1][y]);
        }

        //left
        if (y > 0) {
            el.push(data[x][y - 1]);
        }

        //right
        if (y < this.props.width - 1) {
            el.push(data[x][y + 1]);
        }

        // top left
        if (x > 0 && y > 0) {
            el.push(data[x - 1][y - 1]);
        }

        // top right
        if (x > 0 && y < this.props.width - 1) {
            el.push(data[x - 1][y + 1]);
        }

        // bottom right
        if (x < this.props.height - 1 && y < this.props.width - 1) {
            el.push(data[x + 1][y + 1]);
        }

        // bottom left
        if (x < this.props.height - 1 && y > 0) {
            el.push(data[x + 1][y - 1]);
        }

        return el;
    }

    // reveals the whole board
    revealBoard() {
        let updatedData = this.state.boardData;
        updatedData.map((datarow) => {
            datarow.map((dataitem) => {
                dataitem.isShown = true;
            });
        });
        this.setState({
            boardData: updatedData
        })
    }

    /* reveal logic for empty cell */
    revealEmpty(x, y, data) {
        let area = this.traverseBoard(x, y, data);
        area.map(value => {
            if (!value.isFlagged && !value.isShown && (value.isEmpty || !value.isaMine)) {
                data[value.x][value.y].isShown = true;
                if (value.isEmpty) {
                    this.revealEmpty(value.x, value.y, data);
                }
            }
        });
        return data;

    }

    // Handle User Events

    _handleCellClick(x, y) {

        // check if revealed. return if true.
        if (this.state.boardData[x][y].isShown || this.state.boardData[x][y].isFlagged) return null;

        // check if mine. game over if true
        if (this.state.boardData[x][y].isaMine) {
            this.setState({gameStatus: "You Lost."});
            this.revealBoard();
            alert("game over");
        }

        let updatedData = this.state.boardData;
        updatedData[x][y].isFlagged = false;
        updatedData[x][y].isShown = true;

        if (updatedData[x][y].isEmpty) {
            updatedData = this.revealEmpty(x, y, updatedData);
        }

        if (this.getHidden(updatedData).length === this.props.mines) {
            this.setState({mineCount: 0, gameStatus: "You Win."});
            this.revealBoard();
            alert("You Win");
        }

        this.setState({
            boardData: updatedData,
            mineCount: this.props.mines - this.getFlags(updatedData).length,
        });
    }

    _handleContextMenu(e, x, y) {
        e.preventDefault();
        let updatedData = this.state.boardData;
        let mines = this.state.mineCount;

        // check if already revealed
        if (updatedData[x][y].isShown) return;

        if (updatedData[x][y].isFlagged) {
            updatedData[x][y].isFlagged = false;
            mines++;
        } else {
            updatedData[x][y].isFlagged = true;
            mines--;
        }

        if (mines === 0) {
            const mineArray = this.getMines(updatedData);
            const FlagArray = this.getFlags(updatedData);
            if (JSON.stringify(mineArray) === JSON.stringify(FlagArray)) {
                this.setState({mineCount: 0, gameStatus: "You Win."});
                this.revealBoard();
                alert("You Win");
            }
        }

        this.setState({
            boardData: updatedData,
            mineCount: mines,
        });
    }

    renderBoard(data) {
        return data.map((datarow) => {
            return datarow.map((dataitem) => {
                return (
                    <div key={dataitem.x * datarow.length + dataitem.y}>
                        <Cell
                            onClick={() => this._handleCellClick(dataitem.x, dataitem.y)}
                            cMenu={(e) => this._handleContextMenu(e, dataitem.x, dataitem.y)}
                            value={dataitem}
                        />
                        {(datarow[datarow.length - 1] === dataitem) ? <div className="clear" /> : ""}
                    </div>);
            })
        });

    }

  render() {
        return (
            <div className="board">
                <div className="my-info">
                    <button class="icon"><a href="https://github.com/keeganosler"><i class="fa fa-github-square"></i></a></button>
                    <button class="icon"><a href="https://www.linkedin.com/in/keegan-osler-63a559177"><i class="fa fa-linkedin-square"></i></a></button>
                </div>
                <div className="game-info">
                    <span className="info">Mines remaining: {this.state.mineCount}</span>
                    <h1 className="info">{this.state.gameStatus}</h1>
                </div>
                {
                    this.renderBoard(this.state.boardData)
                }
            </div>
        );
    }
}

// Game Class
class Game extends React.Component {
  state = {
    height: 8,
    width: 8,
    mines: 10
  };

  render() {
    const { height, width, mines } = this.state;
    return (
      <div className="game">
        <Board height={height} width={width} mines={mines} />
      </div>
    );
  }
}


ReactDOM.render(<Game />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
