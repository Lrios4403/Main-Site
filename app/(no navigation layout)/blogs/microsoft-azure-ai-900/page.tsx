import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";
import blog from "./page.module.css";

export default function Home() {
    return (
        <>
            <Window title="Title" className={styles.header} bodyStyle={{ padding: "12px 16px 14px" }}>
                <h2 className={styles.brand}>Stuff I Learned for Microsoft Azure AI 900</h2>
                <p className={styles.headerWelcome}>
                    My blog post about the Microsoft Azure AI 900 course! I have a bunch of resources as well listed. May not be fully complete, but I will be updating it as I go along. I will also be adding more resources as I find them.
                </p>
            </Window>

            <div className={`${styles.contentArea} ${blog.prose}`}>
                <Window id="introduction" title="Introduction" bodyStyle={{ padding: 8, paddingTop: 18 }}>
                    <h1>What is Artificial Intelligence (AI)?</h1>
                    <span>The ability of machines to do and perform certain tasks akin to the skills of a human being. Simply put: a computer that can imitate human intelligence and skill. One of the main ways to do this is to give a certail algorithm past data with expected <u>features (inputs)</u> and <u>labels (outputs)</u> in order to correctly label future data, this is called <u>Machine Learning</u></span>
                    <span>The core concept behind machine learning:
                        <ul className={styles.list}>
                            <li>Some kind of training data that has been labeled.
                                <ul className={styles.list}>
                                    <li>Features (inputs) - The inputs used for training and prediction.
                                        <ul className={styles.list}>
                                            <li>Ex 1: Images of fruit.</li>
                                            <li>Ex 2: Images of numbers.</li>
                                            <li>Ex 3: Text documents in raw format.</li>
                                        </ul>
                                    </li>
                                    <li>Labels (outputs) - The expected results for the training data. What we want to predict.
                                        <ul className={styles.list}>
                                            <li>Ex 1: The labels of the images of fruit.</li>
                                            <li>Ex 2: The labels of the images of numbers.</li>
                                            <li>Ex 3: The labels of the text documents in raw format.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                            <li>Some kind of algorithm to process this data to find patterns and correlations from the training data to predict the labels of future data. Some examples include:
                                <ul className={styles.list}>
                                    <li><ul className={styles.list}>Linear Regression:</ul> a model used to predict a dependent variable (label) based on one or more independent variables (features) in a linear relationship. The best way to describe this would be to visualize a graph with a bunch of points in a somewhat linear trend, the model is used to rougly estimate where a point given its features would fall.
                                        <ul className={styles.list}>
                                            <li>Ex: Predicting house prices based on size per ft. Generally a bigger house will cost more so we can use an AI model to train the estimated cost per foot.</li>
                                        </ul>
                                    </li>
                                    <li><ul className={styles.list}>Decision Trees:</ul> a model used to make decisions based on a series of if-else conditions.</li>
                                </ul>
                            </li>
                            <li>Some kind of use case to use this algorithm to pass in new data to get its predicted labels.</li>
                        </ul>
                    </span>
                </Window>

                <br />

                <Window id="training" title="Training (in deeper depth)" bodyStyle={{ padding: 8, paddingTop: 18 }}>
                    <h1>What is Training?</h1>
                    <span>todo</span>

                    <h2 id="supervised-learning">Supervised Learning (Data has labels)</h2>
                    <span>We have a set of data, we have the correct labels for each data point.
                        <ul className={styles.list}>
                            <li>If the data is numeric we will have regression. </li>
                            <li>If the data is categorical we will have classification.
                                <ul className={styles.list}>
                                    <li>The labels could be binary (yes/no). IE is x the collor red, or will someone trip if the curb is x height. </li>
                                    <li>The labels could be multi-class (more than 2 classes). IE what type of fruit is this (apple, orange, banana, etc.), or what type of animal is this (dog, cat, bird, etc). </li>
                                </ul>
                            </li>
                        </ul>
                    </span>

                    <h2 id="unsupervised-learning">Unsupervised Learning (Data has no labels)</h2>
                    <span>We have a set of data, but no correct or any labels. The model tries to find patterns or structures in the data into groups or clusters.
                        <ul className={styles.list}>
                            <li>Clustering: Grouping similar data points together.</li>
                            <li>Dimensionality Reduction: Reducing the number of features while preserving important information.</li>
                        </ul>
                    </span>
                </Window>

                <br />

                <Window id="deep-learning" title="Deep Learning" bodyStyle={{ padding: 8, paddingTop: 18 }}>
                    <h1>What is Deep Learning?</h1>
                    <span>Deep learning is a subset of machine learning that uses neural networks with multiple layers to learn and extract features from data. It is particularly effective for tasks such as image recognition, natural language processing, and speech recognition. Deep learning is generally used when the training data is too complex for traditional machine learning methods.</span>
                    <ul className={styles.list}>
                        <li>Neuron: A basic unit of a neural network that processes information.</li>
                        <li>Bias: controls when a neuron fires by shifting its threshold. </li>
                        <li>Weight: A value that determines the influence of a neuron on the next layer.</li>
                        <li>Layer: A collection of neurons in a neural network.</li>
                        <li>Input Layer: The first layer of a neural network that receives the input data.</li>
                        <li>Hidden Layer: Layers between the input and output layers that perform computations.</li>
                        <li>Output Layer: The final layer of a neural network that produces the predicted output.</li>
                        <li>Activation Function: A function appended to the output of a neuron to introduce non-linearity. Take the value of the output and transform it into a different value, may be given a threshold to do so.
                            <ul className={styles.list}>
                                <li>Linear: A function that outputs the input value as is. <i>output = x</i></li>
                                <li>
                                    Rectified Linear Unit (ReLU): A popular activation function that sets all negative values to zero.
                                    <span> if(x &gt; 0) {'{ output = x; }'} else {'{ output = 0; }'}</span>
                                </li>
                                <li>Sigmoid: A function that maps input values to a range between 0 and 1. <i> output = 1 / (1 + e^(-x))</i></li>
                            </ul>
                        </li>
                    </ul>
                </Window>

                <br />

                
                <Window id="ai-workloads" title="AI Workloads and Solutions" bodyStyle={{ padding: 8, paddingTop: 18 }}>
                    <h1 id="computer-vision">Computer Vision (Vision AI)</h1>
                    <span>Computer vision is a field of AI that enables computers to interpret and understand visual information from the world, such as images and videos. It involves tasks such as image classification, object detection, image segmentation, and facial recognition. Computer vision is used in various applications, including autonomous vehicles, medical imaging, surveillance systems, and augmented reality.</span>
                    <ul>
                        <li>Image Classification: Classsify Images based on the content of the image.</li>
                        <li>Object Detection: Identify and locate <u>individual objects</u> within the image via <u>bounding boxes</u>.</li>
                        <li>Segmentic Detection: Identify and locate <u>individual objects</u> within the image <u>pixel by pixel </u>.</li>
                        <li>Facial Recognition: Identify and verify individuals based on their facial features. It can also provide a persons age, gender, and other attributes.</li>
                        <li>Image analysis: Analyze images to extract meaningful information via combined models.</li>
                        <li>Optical Character Recognition (OCR): Extract text from images.</li>
                        <li>Tagging: Assign labels, categories, or metadata to images based on their content.</li>
                        <li>Content Organization: Arrange and categorize images for easier retrieval and management.</li>
                    </ul>

                    <h1 id="nlp">Natural Language Processing (NLP)</h1>
                    <span>NLP is a field of AI that focuses on the interaction between computers and human language. It involves tasks such as text classification, sentiment analysis, named entity recognition, and machine translation. NLP is used in various applications, including chatbots, voice assistants, and automated content generation.</span>
                
                    <h1>Deep Learning</h1>

                    <h1>Machine Learning</h1>

                    <h1>Reinforcement Learning</h1>

                    <h1>Generative AI</h1>
                </Window>

                <br />


                <Window id="vocabulary" title="Vocabulary">
                    <ul className={styles.list}>
                        <li></li>
                    </ul>
                </Window>


            </div>


            {/* Left-hand navigation */}
            <div className={styles.navLhs}>
                <Window title="Navigation" bodyStyle={{ padding: 8, paddingLeft: 12 }}>
                    <ul className={styles.list}>
                        <li>
                            <a href="#introduction">Introduction</a>
                        </li>
                        <li>
                            <a href="#training">Training</a>
                            <ul className={styles.list}>
                                <li>
                                    <a href="#supervised-learning">Supervised Learning</a>
                                </li>
                                <li>
                                    <a href="#unsupervised-learning">Unsupervised Learning</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="#deep-learning">Deep Learning</a>
                        </li>
                        <li>
                            <a href="#ai-workloads">AI Workloads &amp; Solutions</a>
                            <ul className={styles.list}>
                                <li>
                                    <a href="#computer-vision">Computer Vision</a>
                                </li>
                                <li>
                                    <a href="#nlp">Natural Language Processing</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="#vocabulary">Vocabulary</a>
                        </li>
                    </ul>
                </Window>
            </div>
        </>
    );
}
