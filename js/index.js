import React from 'react'
import ReactDOM from 'react-dom'

import pdf from '../docs/pdf.pdf'

const scale = 1.5

class App extends React.Component {
  state = {
    isLoading: true,
    isRendering: false,
    pageCount: 0,
    pageNum: 1,
    pageNumIsPending: null,
    pdfDoc: null
  }

  componentDidMount = () => {
    pdfjsLib
      .getDocument(pdf)
      .promise.then(data => {
        this.setState({
          isLoading: false,
          pageCount: data.numPages,
          pdfDoc: data
        })
        this.renderPage(this.state.pageNum)
      })
      .catch(err => {
        this.setState({
          error: err.message,
          hasError: true,
          isLoading: false
        })
      })
  }

  renderPage = num => {
    this.setState({ isRendering: true })

    const canvas = document.querySelector('#pdf-render')
    const ctx = canvas.getContext('2d')

    this.state.pdfDoc.getPage(num).then(page => {
      const viewport = page.getViewport({ scale })
      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderCtx = {
        canvasContext: ctx,
        viewport
      }

      page.render(renderCtx).promise.then(() => {
        this.setState({ isRendering: false })

        if (this.state.pageNumIsPending !== null) {
          renderPage(this.state.pageNumIsPending)
          this.setState({ pageNumIsPending: null })
        }
      })

      this.setState({ pageNum: num })
    })
  }

  queueRenderPage = num => {
    if (this.state.isRendering) {
      this.setState({ pageNumIsPending: num })
    } else {
      this.renderPage(num)
    }
  }

  showPrevPage = () => {
    if (this.state.pageNum <= 1) {
      return
    }
    const prevPage = this.state.pageNum - 1
    this.setState({ pageNum: prevPage })
    this.queueRenderPage(prevPage)
  }

  showNextPage = () => {
    if (this.state.pageNum >= this.state.pdfDoc.numPages) {
      return
    }
    const nextPage = this.state.pageNum + 1
    this.setState({ pageNum: nextPage })
    this.queueRenderPage(nextPage)
  }

  render() {
    const { error, hasError, isLoading, pageCount, pageNum } = this.state

    if (isLoading)
      return (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin" />
        </div>
      )
    return (
      <div>
        {hasError && <div className="error">{error}</div>}
        {!hasError && (
          <div className="top-bar">
            <button className="btn" id="prev-page" onClick={this.showPrevPage}>
              <i className="fas fa-arrow-circle-left" /> Prev Page
            </button>
            <button className="btn" id="next-page" onClick={this.showNextPage}>
              Next Page <i className="fas fa-arrow-circle-right" />
            </button>
            <span className="page-info">
              Page {pageNum} of {pageCount}
            </span>
          </div>
        )}

        <canvas id="pdf-render" />
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'))
